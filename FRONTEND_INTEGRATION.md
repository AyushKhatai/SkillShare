# Frontend Integration Instructions

## Adding Backend Integration to HTML Files

To complete the fullstack integration, you need to add the API scripts to your HTML files.

### 1. Update login.html

Add these scripts before the closing `</body>` tag:

```html
    <script src="api.js"></script>
    <script src="auth-login.js"></script>
</body>
```

**Complete script section should look like:**
```html
    <script src="api.js"></script>
    <script src="script.js"></script>
    <script src="auth-login.js"></script>
</body>
</html>
```

---

### 2. Update register.html

Add these scripts before the closing `</body>` tag:

```html
    <script src="api.js"></script>
    <script src="auth-register.js"></script>
</body>
```

**Complete script section should look like:**
```html
    <script src="api.js"></script>
    <script src="script.js"></script>
    <script src="auth-register.js"></script>
</body>
</html>
```

---

### 3. Update dashboard.html

Add the API script before other scripts:

```html
    <script src="api.js"></script>
    <script src="dashboard.js"></script>
</body>
```

Then add authentication check at the top of dashboard.js:

```javascript
// Check if user is authenticated
if (!API || !API.auth.isAuthenticated()) {
    window.location.href = '/login.html';
}

// Load user data
const user = API.getUser();
if (user) {
    // Display user info in dashboard
    console.log('Logged in user:', user);
}
```

---

### 4. Update skills.html

Add the API script:

```html
    <script src="api.js"></script>
    <script src="skills-page.js"></script>
</body>
```

Then update skills-page.js to fetch skills from API:

```javascript
// Fetch skills from API
async function loadSkills() {
    try {
        const response = await API.skills.getAllSkills();
        const skills = response.skills;
        
        // Render skills
        displaySkills(skills);
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadSkills);
```

---

### 5. Update index.html (Landing Page)

Add the API script to enable login/logout functionality:

```html
    <script src="api.js"></script>
    <script src="script.js"></script>
    <script>
        // Check if user is logged in
        if (API && API.auth.isAuthenticated()) {
            const user = API.getUser();
            // Update UI to show logged in state
            // e.g., change "Login" button to "Dashboard"
        }
    </script>
</body>
```

---

## Quick Copy-Paste Solutions

### For login.html
Find this line:
```html
    <script src="script.js"></script>
</body>
```

Replace with:
```html
    <script src="api.js"></script>
    <script src="script.js"></script>
    <script src="auth-login.js"></script>
</body>
```

---

### For register.html
Find this line:
```html
    <script src="script.js"></script>
</body>
```

Replace with:
```html
    <script src="api.js"></script>
    <script src="script.js"></script>
    <script src="auth-register.js"></script>
</body>
```

---

## Testing After Integration

### 1. Start the server
```bash
npm run dev
```

### 2. Test Registration
- Go to `http://localhost:3000/register.html`
- Fill in the form
- Submit
- Should see success message and redirect to login

### 3. Test Login
- Go to `http://localhost:3000/login.html`
- Enter credentials from registration
- Submit
- Should see success message and redirect to dashboard

### 4. Check Browser Console
- Open DevTools (F12)
- Check Console tab for any errors
- Check Network tab to see API requests

---

## Common Issues and Solutions

### Issue: "API is not defined"
**Solution**: Make sure `api.js` is loaded before other scripts

### Issue: "Cannot read property 'auth' of undefined"
**Solution**: Check that `api.js` is loaded correctly and server is running

### Issue: Login/Register not working
**Solutions**:
1. Check server is running (`npm run dev`)
2. Check database is running
3. Check browser console for errors
4. Verify API endpoint in `api.js` matches your server URL

### Issue: CORS errors
**Solution**: Server is already configured for CORS, but if issues persist:
- Check server.js has `app.use(cors())`
- Restart the server

---

## Manual Integration Steps

If you prefer to manually integrate:

### Step 1: Add API Service
Add to all HTML pages that need backend access:
```html
<script src="api.js"></script>
```

### Step 2: Add Page-Specific Handlers
- Login page: Add `auth-login.js`
- Register page: Add `auth-register.js`

### Step 3: Update Existing JavaScript
Modify existing JS files to use the API:

```javascript
// Old way (example)
// const skills = mockData;

// New way
const response = await API.skills.getAllSkills();
const skills = response.skills;
```

---

## Example: Complete Integration for Login Page

**login.html** (end of file):
```html
        </div>
    </div>

    <script src="api.js"></script>
    <script src="script.js"></script>
    <script src="auth-login.js"></script>
</body>
</html>
```

That's it! The `auth-login.js` file already contains all the logic to:
- Handle form submission
- Call the login API
- Store the token
- Redirect to dashboard
- Handle errors

---

## Verification Checklist

After updating HTML files:

- [ ] `api.js` is included in all pages
- [ ] `auth-login.js` is included in login.html
- [ ] `auth-register.js` is included in register.html
- [ ] Server is running (`npm run dev`)
- [ ] Database is set up and running
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] Token is stored in localStorage
- [ ] Redirects work correctly

---

## Need Help?

1. Check browser console for errors
2. Check server console for errors
3. Verify database connection
4. Check network tab in DevTools
5. Review the API documentation in BACKEND_SETUP.md

---

**Once you've added these scripts, your fullstack integration will be complete! 🎉**
