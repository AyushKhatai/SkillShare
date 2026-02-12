# Campus Skill Share - Backend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

#### Create Database
Open PostgreSQL and create a new database:
```sql
CREATE DATABASE campus_skill_share;
```

#### Run Schema
Execute the schema file to create all tables:
```bash
psql -U postgres -d campus_skill_share -f database/schema.sql
```

Or manually run the SQL from `database/schema.sql` in your PostgreSQL client.

### 3. Environment Configuration

The `.env` file is already configured with:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Ayush@1013
DB_NAME=campus_skill_share
JWT_SECRET=mysecretkey
JWT_EXPIRE=7d
```

**Important:** Change `JWT_SECRET` to a secure random string in production!

### 4. Start the Server

Development mode:
```bash
npm run dev
```

Or production mode:
```bash
npm start
```

Add these scripts to `package.json`:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get current user profile (protected)
- `PUT /api/users/profile` - Update profile (protected)
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/all` - Get all users
- `DELETE /api/users/account` - Delete account (protected)

### Skills
- `GET /api/skills` - Get all skills (with filters)
- `GET /api/skills/:skillId` - Get skill by ID
- `GET /api/skills/user/:userId` - Get skills by user
- `GET /api/skills/my/skills` - Get current user's skills (protected)
- `POST /api/skills` - Create skill (protected)
- `PUT /api/skills/:skillId` - Update skill (protected)
- `DELETE /api/skills/:skillId` - Delete skill (protected)

### Bookings
- `GET /api/bookings` - Get all bookings (protected)
- `GET /api/bookings/student` - Get bookings as student (protected)
- `GET /api/bookings/teacher` - Get bookings as teacher (protected)
- `GET /api/bookings/:bookingId` - Get booking by ID (protected)
- `POST /api/bookings` - Create booking (protected)
- `PUT /api/bookings/:bookingId/status` - Update booking status (protected)
- `DELETE /api/bookings/:bookingId` - Delete booking (protected)

### Reviews
- `GET /api/reviews/skill/:skillId` - Get reviews for skill
- `GET /api/reviews/my` - Get current user's reviews (protected)
- `POST /api/reviews` - Create review (protected)
- `PUT /api/reviews/:reviewId` - Update review (protected)
- `DELETE /api/reviews/:reviewId` - Delete review (protected)

## Project Structure

```
campus-skill-share/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── skillController.js   # Skill management
│   ├── bookingController.js # Booking management
│   └── reviewController.js  # Review management
├── middleware/
│   ├── authMiddleware.js    # JWT authentication
│   ├── validation.js        # Input validation
│   └── errorHandler.js      # Error handling
├── models/
│   ├── User.js              # User model
│   ├── Skill.js             # Skill model
│   ├── Booking.js           # Booking model
│   └── Review.js            # Review model
├── routes/
│   ├── auth.js              # Auth routes
│   ├── users.js             # User routes
│   ├── skills.js            # Skill routes
│   ├── bookings.js          # Booking routes
│   └── reviews.js           # Review routes
├── database/
│   └── schema.sql           # Database schema
├── api.js                   # Frontend API service
├── server.js                # Main server file
├── .env                     # Environment variables
└── package.json             # Dependencies
```

## Frontend Integration

Include the API service in your HTML files:
```html
<script src="api.js"></script>
```

### Example Usage

#### Register User
```javascript
const userData = {
  full_name: "John Doe",
  email: "john@college.edu",
  password: "password123"
};

API.auth.register(userData)
  .then(response => console.log(response))
  .catch(error => console.error(error));
```

#### Login
```javascript
const credentials = {
  email: "john@college.edu",
  password: "password123"
};

API.auth.login(credentials)
  .then(response => {
    console.log('Logged in!', response);
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
  })
  .catch(error => console.error(error));
```

#### Get Skills
```javascript
API.skills.getAllSkills({ category: 'Programming', limit: 10 })
  .then(response => {
    console.log('Skills:', response.skills);
  })
  .catch(error => console.error(error));
```

#### Create Booking
```javascript
const bookingData = {
  skill_id: 1,
  booking_date: '2026-02-15',
  booking_time: '14:00:00',
  message: 'Looking forward to learning!'
};

API.bookings.createBooking(bookingData)
  .then(response => console.log('Booking created!', response))
  .catch(error => console.error(error));
```

## Testing

You can test the API using:
- Postman
- Thunder Client (VS Code extension)
- cURL commands

Example cURL:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John Doe","email":"john@college.edu","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@college.edu","password":"password123"}'
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process using port 3000:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

### CORS Issues
- The server is configured to allow all origins
- For production, update CORS settings in `server.js`

## Next Steps

1. Install nodemon for development:
   ```bash
   npm install --save-dev nodemon
   ```

2. Add validation to auth routes in `routes/auth.js`

3. Implement file upload for profile images and skill images

4. Add email verification for registration

5. Implement password reset functionality

6. Add rate limiting for API endpoints

7. Set up logging with Winston or Morgan

## Security Notes

- Change JWT_SECRET before deployment
- Use HTTPS in production
- Implement rate limiting
- Add input sanitization
- Use prepared statements (already implemented with pg)
- Implement CSRF protection for production
