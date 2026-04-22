const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { OAuth2Client } = require('google-auth-library');

exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING user_id, full_name, email`,
      [full_name, email, password_hash]
    );

    // Generate token for auto-login after registration
    const token = jwt.sign(
      { user_id: result.rows[0].user_id, email: result.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: result.rows[0].user_id,
        user_id: result.rows[0].user_id,
        name: result.rows[0].full_name,
        email: result.rows[0].email
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Check if user has a password hash
    if (!user.password_hash) {
      // User registered via Google - offer to link password
      return res.status(400).json({
        message: "This account was created with Google. Would you like to set a password to login with email?",
        needsPasswordLink: true,
        email: email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        name: user.full_name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("Google Client ID not configured");
      return res.status(500).json({ message: "Google authentication not configured" });
    }

    console.log("Using Google Client ID:", clientId);

    const oauthClient = new OAuth2Client(clientId);

    let ticket;
    try {
      ticket = await oauthClient.verifyIdToken({
        idToken: token,
        audience: clientId
      });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError.message);
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const payload = ticket.getPayload();
    const { name, email, sub } = payload;

    console.log("Google user verified:", email);

    let result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      // Create new user with Google info
      result = await db.query(
        `INSERT INTO users (full_name, email, google_id)
         VALUES ($1, $2, $3)
         RETURNING user_id, full_name, email`,
        [name, email, sub]
      );
      user = result.rows[0];
      console.log("New Google user created:", user.email);
    } else {
      // Update google_id if not set
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = $1 WHERE user_id = $2', [sub, user.user_id]);
        user.google_id = sub;
      }
      console.log("Existing user found:", user.email);
    }

    const jwtToken = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        name: user.full_name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Google Auth Error:", error.message);
    res.status(500).json({ message: "Google authentication failed: " + error.message });
  }
};

// Link password to Google account for regular login
exports.linkPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Check if user already has a password
    if (user.password_hash) {
      return res.status(400).json({ message: "This account already has a password set" });
    }

    // Hash the new password and update
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [password_hash, user.user_id]
    );

    // Generate token for immediate login
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: "Password linked successfully! You can now login with email.",
      token,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Link password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
