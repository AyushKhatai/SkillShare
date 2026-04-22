# Campus Skill Share Backend SQL Queries

This document contains all the backend SQL queries used in the Campus Skill Share project, extracted from your models and controllers. These queries represent exactly how your Node.js backend interacts with the PostgreSQL database.

## 1. Authentication (`controllers/authController.js`)

**Check if Email Exists (Register & Login & Link Password):**
```sql
SELECT * FROM users WHERE email = $1;
```

**Register New User:**
```sql
INSERT INTO users (full_name, email, password_hash)
VALUES ($1, $2, $3)
RETURNING user_id, full_name, email;
```

**Register User via Google Auth:**
```sql
INSERT INTO users (full_name, email, google_id)
VALUES ($1, $2, $3)
RETURNING user_id, full_name, email;
```

**Update User's Google ID:**
```sql
UPDATE users SET google_id = $1 WHERE user_id = $2;
```

**Link Password to Google Account:**
```sql
UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2;
```

---

## 2. Users (`models/User.js`)

**Find User by ID:**
```sql
SELECT user_id, full_name, email, bio, profile_image, phone, department, year_of_study, created_at 
FROM users 
WHERE user_id = $1;
```

**Find User by Email:**
```sql
SELECT * FROM users WHERE email = $1;
```

**Create User (Fallback Model Method):**
```sql
INSERT INTO users (full_name, email, password_hash, bio, profile_image, phone, department, year_of_study)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING user_id, full_name, email, bio, profile_image, phone, department, year_of_study, created_at;
```

**Update User Profile:**
```sql
UPDATE users 
SET full_name = COALESCE($1, full_name),
    bio = COALESCE($2, bio),
    profile_image = COALESCE($3, profile_image),
    phone = COALESCE($4, phone),
    department = COALESCE($5, department),
    year_of_study = COALESCE($6, year_of_study),
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $7
RETURNING user_id, full_name, email, bio, profile_image, phone, department, year_of_study;
```

**Find All Users:**
```sql
SELECT user_id, full_name, email, bio, profile_image, department, year_of_study, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT $1 OFFSET $2;
```

**Delete User:**
```sql
DELETE FROM users WHERE user_id = $1;
```

---

## 3. Skills (`models/Skill.js`)

**Find All Skills (with optional filters):**
```sql
SELECT s.*, u.full_name as teacher_name, u.profile_image as teacher_image
FROM skills s
JOIN users u ON s.user_id = u.user_id
WHERE s.is_active = true 
-- Optional dynamically appended filters:
-- AND s.category = $1
-- AND s.skill_level = $2
-- AND (s.title ILIKE $x OR s.description ILIKE $x)
ORDER BY s.created_at DESC
LIMIT $limit OFFSET $offset;
```

**Find Skill by ID:**
```sql
SELECT s.*, u.full_name as teacher_name, u.email as teacher_email, 
       u.profile_image as teacher_image, u.bio as teacher_bio
FROM skills s
JOIN users u ON s.user_id = u.user_id
WHERE s.skill_id = $1;
```

**Find Skills by User ID:**
```sql
SELECT * FROM skills WHERE user_id = $1 ORDER BY created_at DESC;
```

**Create New Skill:**
```sql
INSERT INTO skills (user_id, title, description, category, skill_level, duration, price, location)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;
```

**Update Skill:**
```sql
UPDATE skills 
SET title = COALESCE($1, title),
    description = COALESCE($2, description),
    category = COALESCE($3, category),
    skill_level = COALESCE($4, skill_level),
    duration = COALESCE($5, duration),
    price = COALESCE($6, price),
    location = COALESCE($7, location),
    is_active = COALESCE($8, is_active),
    updated_at = CURRENT_TIMESTAMP
WHERE skill_id = $9
RETURNING *;
```

**Delete Skill:**
```sql
DELETE FROM skills WHERE skill_id = $1;
```

**Update Skill Average Rating:**
```sql
UPDATE skills 
SET average_rating = (
  SELECT COALESCE(AVG(rating), 0) 
  FROM reviews 
  WHERE skill_id = $1
)
WHERE skill_id = $1;
```

**Increment Skill Bookings Count:**
```sql
UPDATE skills 
SET total_bookings = total_bookings + 1 
WHERE skill_id = $1;
```

---

## 4. Bookings (`models/Booking.js`)

**Find Bookings by User ID (As Student or Teacher):**
```sql
SELECT b.*, 
       s.title as skill_title, s.category, s.duration, s.price, s.location,
       student.full_name as student_name, student.email as student_email,
       teacher.full_name as teacher_name, teacher.email as teacher_email
FROM bookings b
JOIN skills s ON b.skill_id = s.skill_id
JOIN users student ON b.student_id = student.user_id
JOIN users teacher ON b.teacher_id = teacher.user_id
WHERE b.student_id = $1 OR b.teacher_id = $1
ORDER BY b.booking_date DESC, b.booking_time DESC;
```

**Find Bookings as Student:**
```sql
SELECT b.*, 
       s.title as skill_title, s.category, s.duration, s.price, s.location,
       teacher.full_name as teacher_name, teacher.email as teacher_email, teacher.profile_image as teacher_image
FROM bookings b
JOIN skills s ON b.skill_id = s.skill_id
JOIN users teacher ON b.teacher_id = teacher.user_id
WHERE b.student_id = $1
ORDER BY b.booking_date DESC, b.booking_time DESC;
```

**Find Bookings as Teacher:**
```sql
SELECT b.*, 
       s.title as skill_title, s.category, s.duration, s.price, s.location,
       student.full_name as student_name, student.email as student_email, student.profile_image as student_image
FROM bookings b
JOIN skills s ON b.skill_id = s.skill_id
JOIN users student ON b.student_id = student.user_id
WHERE b.teacher_id = $1
ORDER BY b.booking_date DESC, b.booking_time DESC;
```

**Find Booking by ID:**
```sql
SELECT b.*, 
       s.title as skill_title, s.category, s.duration, s.price, s.location,
       student.full_name as student_name, student.email as student_email,
       teacher.full_name as teacher_name, teacher.email as teacher_email
FROM bookings b
JOIN skills s ON b.skill_id = s.skill_id
JOIN users student ON b.student_id = student.user_id
JOIN users teacher ON b.teacher_id = teacher.user_id
WHERE b.booking_id = $1;
```

**Create Booking:**
```sql
INSERT INTO bookings (skill_id, student_id, teacher_id, booking_date, booking_time, message)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
```

**Update Booking Status:**
```sql
UPDATE bookings 
SET status = $1, updated_at = CURRENT_TIMESTAMP
WHERE booking_id = $2
RETURNING *;
```

**Delete Booking:**
```sql
DELETE FROM bookings WHERE booking_id = $1;
```

**Find Bookings by Skill ID:**
```sql
SELECT b.*, 
       student.full_name as student_name, student.email as student_email
FROM bookings b
JOIN users student ON b.student_id = student.user_id
WHERE b.skill_id = $1
ORDER BY b.booking_date DESC, b.booking_time DESC;
```

---

## 5. Reviews (`models/Review.js`)

**Find Reviews by Skill ID:**
```sql
SELECT r.*, u.full_name, u.profile_image
FROM reviews r
JOIN users u ON r.user_id = u.user_id
WHERE r.skill_id = $1
ORDER BY r.created_at DESC;
```

**Find Review by ID:**
```sql
SELECT r.*, u.full_name, u.profile_image
FROM reviews r
JOIN users u ON r.user_id = u.user_id
WHERE r.review_id = $1;
```

**Find Reviews by User ID:**
```sql
SELECT r.*, s.title as skill_title
FROM reviews r
JOIN skills s ON r.skill_id = s.skill_id
WHERE r.user_id = $1
ORDER BY r.created_at DESC;
```

**Create Review:**
```sql
INSERT INTO reviews (skill_id, user_id, rating, comment)
VALUES ($1, $2, $3, $4)
RETURNING *;
```

**Update Review:**
```sql
UPDATE reviews 
SET rating = COALESCE($1, rating),
    comment = COALESCE($2, comment),
    updated_at = CURRENT_TIMESTAMP
WHERE review_id = $3
RETURNING *;
```

**Delete Review:**
```sql
DELETE FROM reviews WHERE review_id = $1;
```

**Check if User Already Reviewed a Skill:**
```sql
SELECT review_id FROM reviews WHERE skill_id = $1 AND user_id = $2;
```

---

## 6. Messages (`models/Message.js`)

**Check if Conversation Exists:**
```sql
SELECT * FROM conversations WHERE conversation_id = $1;
```

**Create New Conversation:**
```sql
INSERT INTO conversations (conversation_id, user1_id, user2_id, booking_id, skill_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
```

**Insert New Message:**
```sql
INSERT INTO messages (conversation_id, sender_id, receiver_id, booking_id, content)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
```

**Update Conversation's Last Message:**
```sql
UPDATE conversations 
SET last_message = $1, last_message_at = CURRENT_TIMESTAMP 
WHERE conversation_id = $2;
```

**Get Messages for a Conversation:**
```sql
SELECT m.*, 
       u.full_name as sender_name, u.profile_image as sender_image
FROM messages m
JOIN users u ON m.sender_id = u.user_id
WHERE m.conversation_id = $1
ORDER BY m.created_at ASC
LIMIT $2 OFFSET $3;
```

**Get All Conversations for a User:**
```sql
SELECT c.*,
       u1.full_name as user1_name, u1.profile_image as user1_image,
       u2.full_name as user2_name, u2.profile_image as user2_image,
       s.title as skill_title, s.category as skill_category,
       (SELECT COUNT(*) FROM messages m 
        WHERE m.conversation_id = c.conversation_id 
        AND m.receiver_id = $1 AND m.is_read = false) as unread_count
FROM conversations c
JOIN users u1 ON c.user1_id = u1.user_id
JOIN users u2 ON c.user2_id = u2.user_id
LEFT JOIN skills s ON c.skill_id = s.skill_id
WHERE c.user1_id = $1 OR c.user2_id = $1
ORDER BY c.last_message_at DESC;
```

**Mark Messages as Read:**
```sql
UPDATE messages 
SET is_read = true 
WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false;
```

**Get Unread Message Count for a User:**
```sql
SELECT COUNT(*) as count 
FROM messages 
WHERE receiver_id = $1 AND is_read = false;
```

**Delete a Message:**
```sql
DELETE FROM messages WHERE message_id = $1 AND sender_id = $2 RETURNING *;
```
