# Campus Skill Share - Fullstack Project

A modern, fullstack campus skill-sharing platform where college students can share and learn skills from each other.

## 🚀 Features

### Frontend
- **Modern UI/UX**: Beautiful, responsive design with glassmorphism effects
- **Landing Page**: Engaging homepage with features showcase
- **Authentication**: Login and registration pages
- **Dashboard**: User dashboard for managing skills and bookings
- **Skills Browsing**: Browse and filter available skills
- **Reviews System**: Rate and review skills

### Backend
- **RESTful API**: Complete REST API with Express.js
- **Authentication**: JWT-based authentication system
- **Database**: PostgreSQL database with comprehensive schema
- **CRUD Operations**: Full CRUD for users, skills, bookings, and reviews
- **Authorization**: Role-based access control
- **Validation**: Input validation with express-validator
- **Error Handling**: Comprehensive error handling middleware

## 📁 Project Structure

```
campus-skill-share/
├── Frontend Files
│   ├── index.html              # Landing page
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── dashboard.html          # User dashboard
│   ├── skills.html             # Skills browsing page
│   ├── reviews.html            # Reviews page
│   ├── style.css               # Main styles
│   ├── auth.css                # Authentication styles
│   ├── dashboard.css           # Dashboard styles
│   ├── skills-page.css         # Skills page styles
│   ├── script.js               # Main JavaScript
│   ├── dashboard.js            # Dashboard JavaScript
│   ├── skills-page.js          # Skills page JavaScript
│   ├── api.js                  # API service layer
│   ├── auth-login.js           # Login handler
│   └── auth-register.js        # Registration handler
│
├── Backend Files
│   ├── server.js               # Express server
│   ├── config/
│   │   └── database.js         # Database configuration
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── userController.js   # User management
│   │   ├── skillController.js  # Skill management
│   │   ├── bookingController.js# Booking management
│   │   └── reviewController.js # Review management
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT authentication
│   │   ├── validation.js       # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Skill.js            # Skill model
│   │   ├── Booking.js          # Booking model
│   │   └── Review.js           # Review model
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── users.js            # User routes
│   │   ├── skills.js           # Skill routes
│   │   ├── bookings.js         # Booking routes
│   │   └── reviews.js          # Review routes
│   └── database/
│       └── schema.sql          # Database schema
│
├── Configuration
│   ├── .env                    # Environment variables
│   ├── package.json            # Dependencies
│   └── package-lock.json       # Dependency lock file
│
└── Documentation
    ├── README.md               # This file
    └── BACKEND_SETUP.md        # Backend setup guide
```

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3 (with modern features like CSS Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter, Outfit)

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT (JSON Web Tokens)
- bcrypt (Password hashing)

### Dependencies
- express: ^5.2.1
- pg: ^8.18.0
- bcrypt: ^6.0.0
- jsonwebtoken: ^9.0.3
- dotenv: ^17.2.4
- cors: ^2.8.6
- express-validator: ^7.3.1

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Install nodemon (for development)
```bash
npm install --save-dev nodemon
```

### Step 3: Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE campus_skill_share;
```

2. Run the schema:
```bash
psql -U postgres -d campus_skill_share -f database/schema.sql
```

### Step 4: Configure Environment
The `.env` file is already configured. Update if needed:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=campus_skill_share
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

**Important:** Change `JWT_SECRET` to a secure random string!

### Step 5: Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get current user profile (protected)
- `PUT /api/users/profile` - Update profile (protected)
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/all` - Get all users

### Skills
- `GET /api/skills` - Get all skills (with filters)
- `GET /api/skills/:skillId` - Get skill by ID
- `POST /api/skills` - Create skill (protected)
- `PUT /api/skills/:skillId` - Update skill (protected)
- `DELETE /api/skills/:skillId` - Delete skill (protected)

### Bookings
- `GET /api/bookings` - Get all bookings (protected)
- `POST /api/bookings` - Create booking (protected)
- `PUT /api/bookings/:bookingId/status` - Update booking status (protected)

### Reviews
- `GET /api/reviews/skill/:skillId` - Get reviews for skill
- `POST /api/reviews` - Create review (protected)
- `PUT /api/reviews/:reviewId` - Update review (protected)

For complete API documentation, see [BACKEND_SETUP.md](BACKEND_SETUP.md)

## 💻 Usage

### Frontend Integration

The frontend automatically connects to the backend API. Include the API service:

```html
<script src="api.js"></script>
<script src="auth-login.js"></script> <!-- For login page -->
<!-- OR -->
<script src="auth-register.js"></script> <!-- For registration page -->
```

### Example API Usage

```javascript
// Login
API.auth.login({ email, password })
  .then(response => {
    // Handle success
  })
  .catch(error => {
    // Handle error
  });

// Get skills
API.skills.getAllSkills({ category: 'Programming' })
  .then(response => {
    console.log(response.skills);
  });

// Create booking
API.bookings.createBooking({
  skill_id: 1,
  booking_date: '2026-02-15',
  booking_time: '14:00:00'
})
  .then(response => {
    console.log('Booking created!');
  });
```

## 🗄️ Database Schema

### Tables
- **users**: User accounts and profiles
- **skills**: Skills offered by users
- **bookings**: Booking sessions between students and teachers
- **reviews**: Reviews and ratings for skills

See `database/schema.sql` for complete schema details.

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected routes with middleware
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- CORS configuration
- Error handling without exposing sensitive data

## 🚧 Development

### Running in Development Mode
```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Testing the API

Use tools like:
- Postman
- Thunder Client (VS Code extension)
- cURL

Example:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu","password":"password123"}'
```

## 📝 To-Do / Future Enhancements

- [ ] File upload for profile and skill images
- [ ] Email verification for registration
- [ ] Password reset functionality
- [ ] Real-time notifications
- [ ] Chat system between students and teachers
- [ ] Advanced search and filtering
- [ ] Calendar integration for bookings
- [ ] Payment integration
- [ ] Admin dashboard
- [ ] Analytics and reporting

## 🤝 Contributing

This is a college project. Feel free to fork and modify for your own use.

## 📄 License

ISC

## 👨‍💻 Author

Campus Skill Share Team

## 📞 Support

For issues or questions, please refer to the documentation or create an issue in the repository.

---

**Happy Skill Sharing! 🎓✨**
