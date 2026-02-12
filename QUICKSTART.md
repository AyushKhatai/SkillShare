# Quick Start Guide - Campus Skill Share

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Create database in PostgreSQL
psql -U postgres
CREATE DATABASE campus_skill_share;
\q

# Run schema
psql -U postgres -d campus_skill_share -f database/schema.sql
```

### 3. Start Server
```bash
npm run dev
```

### 4. Open Browser
Navigate to: `http://localhost:3000`

---

## 📋 Common Commands

### Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Database Commands
```bash
# Connect to database
psql -U postgres -d campus_skill_share

# View tables
\dt

# View table structure
\d users
\d skills
\d bookings
\d reviews

# Query data
SELECT * FROM users;
SELECT * FROM skills;
```

---

## 🔑 Quick API Testing

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"full_name\":\"Test User\",\"email\":\"test@college.edu\",\"password\":\"test123\"}"
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@college.edu\",\"password\":\"test123\"}"
```

### Get Skills
```bash
curl http://localhost:3000/api/skills
```

### Get Skills with Filter
```bash
curl "http://localhost:3000/api/skills?category=Programming&limit=5"
```

---

## 🎯 Frontend Pages

- **Home**: `http://localhost:3000/`
- **Login**: `http://localhost:3000/login.html`
- **Register**: `http://localhost:3000/register.html`
- **Dashboard**: `http://localhost:3000/dashboard.html`
- **Skills**: `http://localhost:3000/skills.html`
- **API Docs**: `http://localhost:3000/api`

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Change port in .env
PORT=3001
```

### Database Connection Error
1. Check PostgreSQL is running
2. Verify credentials in `.env`
3. Ensure database exists: `psql -U postgres -l`

### Module Not Found
```bash
npm install
```

---

## 📝 Environment Variables (.env)

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=campus_skill_share
JWT_SECRET=change_this_to_random_string
JWT_EXPIRE=7d
```

---

## 🗂️ File Structure Quick Reference

```
Frontend:
- index.html, login.html, register.html, dashboard.html
- api.js (API service)
- auth-login.js, auth-register.js (Auth handlers)

Backend:
- server.js (Main server)
- routes/ (API endpoints)
- controllers/ (Business logic)
- models/ (Database queries)
- middleware/ (Auth, validation, errors)

Database:
- database/schema.sql (Database structure)
```

---

## 💡 Tips

1. **Always use `npm run dev`** during development for auto-reload
2. **Check console** for errors and logs
3. **Use browser DevTools** to debug frontend
4. **Test API** with Postman or Thunder Client
5. **Keep .env secure** - never commit to git

---

## 🎓 Learning Resources

### Frontend
- HTML/CSS/JavaScript basics
- Fetch API for HTTP requests
- LocalStorage for token management

### Backend
- Express.js routing
- PostgreSQL queries
- JWT authentication
- RESTful API design

---

## ✅ Checklist

- [ ] Node.js installed
- [ ] PostgreSQL installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] Database created
- [ ] Schema loaded
- [ ] .env configured
- [ ] Server running (`npm run dev`)
- [ ] Can access http://localhost:3000

---

**Need help? Check README.md or BACKEND_SETUP.md for detailed documentation.**
