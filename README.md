<br/>
<div align="center">

# 🎓 Campus Skill Share
**A modern, full-stack peer-to-peer learning platform designed for college students.**

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

*Connect, Learn, and Share Skills on Campus.*

</div>

---

## 📖 About The Project

**Campus Skill Share** is a dynamic web application that connects university students to foster a collaborative learning environment. Whether you're looking to master Python, learn guitar, or need help with calculus, this platform enables students to discover peers with those skills, book learning sessions, chat in real-time, and leave reviews. 

The application is built completely from scratch using Vanilla Web Technologies (HTML/CSS/JS) for a lightning-fast frontend that utilizes modern glassmorphism aesthetics, backed by a robust Node.js/Express API and a relational PostgreSQL database.

---

## ✨ Power-Packed Features

### 🎨 Frontend Experience
*   **Vibrant, Modern UI:** High-end glassmorphism elements, fluid animations, and a responsive layout designed for all devices.
*   **Live Messaging System:** Real-time, peer-to-peer interactive chat capabilities right from your dashboard.
*   **Dynamic Leaderboard:** A gamified global leaderboard showcasing the top-rated skills and contributors on campus.
*   **Detailed User Profiles:** Dedicated profile pages displaying users' top skills, resumes/portfolios, and contact preferences.
*   **Smart Toast Notifications:** Non-intrusive, beautifully styled push notifications replacing traditional browser alerts.
*   **Resume/Portfolio Linking:** Specifically targeted for Programming & Design skills, allowing tutors to attach their professional URLs.

### ⚙️ Backend Architecture
*   **RESTful API Engine:** Modular and highly scalable Express routing.
*   **Secure Authentication:** Industrial-grade JWT (JSON Web Tokens) based auth and Bcrypt password hashing.
*   **Relational Database:** Complex PostgreSQL schemas mapping out Users, Skills, Bookings, Messages, and Reviews.
*   **Role-Based Data Access:** Ensuring users can only edit or view the messages/skills they are authorized to access.
*   **Sanitization & Validation:** Defensive programming with Express-Validator protecting against SQL injections and bad payloads.

---

## 🛠️ Technology Stack

| Area | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, Advanced CSS3 (Animations, Variables), Vanilla ES6+ JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL, node-postgres (`pg`) |
| **Security** | `bcrypt`, `jsonwebtoken`, `cors`, `dotenv` |

---

## 🚀 Deployment Guide (Production)

Deploying this highly integrated full-stack application requires three distinct components: The Database, the Backend REST API, and the Frontend Client.

### Step 1: Database Deployment (Neon / Supabase)
We recommend **Neon** or **Supabase** for a free, serverless Postgres database.
1. Create a free account on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Create a new project/database.
3. Grab the **Connection URI string** (e.g., `postgresql://user:password@host/dbname`).
4. Execute the SQL commands found in `database/schema.sql` via their SQL Query Editor to build your tables.

### Step 2: Backend API Deployment (Render / Railway)
We recommend **Render.com** to host the Express API for free.
1. Sign up on [Render.com](https://render.com) and click **New -> Web Service**.
2. Connect your GitHub repository (`AyushKhatai/SkillShare`), and ensure the Root Directory points to the backend location.
3. **Build Command:** `npm install`
4. **Start Command:** `node server.js`
5. **Environment Variables:**
   *   `DATABASE_URL` = (Paste your Neon/Supabase Connection String from Step 1)
   *   `JWT_SECRET` = (Random 64+ char secret string)
   *   `PORT` = `3000`
6. Click **Deploy**. Once successfully deployed, copy the Render API URL (e.g., `https://skillshare-api.onrender.com`).

### Step 3: Frontend Deployment (Vercel / Netlify)
Before deploying the frontend, update the API URLs!
1. **Critical:** In your frontend `.js` files (like `api.js` or `script.js`), change all `http://localhost:3000` requests to your newly deployed backend URL (`https://skillshare-api.onrender.com`).
2. Go to [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) and create a new project.
3. Connect your GitHub repository.
4. Leave build commands blank (since it's vanilla HTML/CSS/JS).
5. Deploy the application! 

---

## 💻 Local Development Setup

If you wish to run the project locally instead of production:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AyushKhatai/SkillShare.git
   cd campus-skill-share
   ```

2. **Install node packages:**
   ```bash
   npm install
   ```

3. **Configure local database:**
   * Install PostgreSQL locally.
   * Run the commands in `database/schema.sql`.
   * Create a `.env` file in the root directory:
     ```env
     PORT=3000
     DB_HOST=localhost
     DB_USER=postgres
     DB_PASSWORD=your_password
     DB_NAME=campus_skill_share
     DB_PORT=5432
     JWT_SECRET=supersecretkey
     ```

4. **Launch the backend server:**
   ```bash
   # Development Server
   npm run dev
   ```

5. **Launch the frontend client:**
   * Open `index.html` in your browser. (We highly recommend using the **Live Server** extension in VS Code for live-reloading!)

---

## 🗄️ Core Database Architecture

*   **`users`**: Manages credentials, roles, and profile imagery.
*   **`skills`**: Connects heavily to the `users` table via foreign keys. Stores category, experience, hourly rate, and portfolio URLs.
*   **`bookings`**: Stores session data with `status` enums (`pending`, `confirmed`, `rejected`).
*   **`messages`**: Ties two users together (sender & receiver) for the live chat ecosystem.
*   **`reviews`**: Handles 1-5 star ratings dynamically factored into the global Leaderboard.

---

## 🔮 Future Roadmap
- [ ] File upload integrations for profile avatars & skill thumbnails.
- [ ] Automated Email verification upon user registration.
- [ ] Integrated Video Calling / Virtual Classroom for remote sessions.
- [ ] Calendar Sync API integrations (Google Calendar).

---

<br/>
<div align="center">
  <b>Designed and Developed by Ayush Khatai</b><br>
  <a href="https://github.com/AyushKhatai">GitHub Profile</a>
</div>
<br/>
