-- Campus Skill Share Database Schema

-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- Nullable for Google Auth users
    google_id VARCHAR(255) UNIQUE,
    bio TEXT,
    profile_image VARCHAR(500),
    phone VARCHAR(20),
    department VARCHAR(100),
    year_of_study VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills Table
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    skill_level VARCHAR(50) NOT NULL, -- Beginner, Intermediate, Advanced
    duration VARCHAR(50), -- e.g., "1 hour", "2 hours"
    price DECIMAL(10, 2) DEFAULT 0.00,
    location VARCHAR(200), -- Online, Campus Library, etc.
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    total_bookings INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    skill_id INTEGER REFERENCES skills(skill_id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    skill_id INTEGER REFERENCES skills(skill_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_bookings_student_id ON bookings(student_id);
CREATE INDEX idx_bookings_teacher_id ON bookings(teacher_id);
CREATE INDEX idx_bookings_skill_id ON bookings(skill_id);
CREATE INDEX idx_reviews_skill_id ON reviews(skill_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- Insert sample data for testing
INSERT INTO users (full_name, email, password_hash, bio, department, year_of_study) VALUES
('John Doe', 'john@college.edu', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Passionate about web development and teaching', 'Computer Science', '3rd Year'),
('Jane Smith', 'jane@college.edu', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Love sharing my photography skills', 'Arts', '2nd Year'),
('Mike Johnson', 'mike@college.edu', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Guitar enthusiast and music lover', 'Music', '4th Year');

INSERT INTO skills (user_id, title, description, category, skill_level, duration, price, location, image_url) VALUES
(1, 'Web Development Basics', 'Learn HTML, CSS, and JavaScript fundamentals', 'Programming', 'Beginner', '2 hours', 0.00, 'Online', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'),
(2, 'Photography Masterclass', 'Master the art of digital photography', 'Arts & Design', 'Intermediate', '3 hours', 500.00, 'Campus Studio', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d'),
(3, 'Guitar for Beginners', 'Learn to play your favorite songs on guitar', 'Music', 'Beginner', '1.5 hours', 300.00, 'Music Room', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1');

INSERT INTO bookings (skill_id, student_id, teacher_id, booking_date, booking_time, status, message) VALUES
(1, 2, 1, '2026-02-15', '14:00:00', 'confirmed', 'Looking forward to learning web development!'),
(2, 3, 2, '2026-02-16', '10:00:00', 'pending', 'Interested in improving my photography skills');

INSERT INTO reviews (skill_id, user_id, rating, comment) VALUES
(1, 2, 5, 'Excellent teacher! Very clear explanations.'),
(1, 3, 4, 'Great session, learned a lot about web development.'),
(2, 1, 5, 'Amazing photography tips and techniques!');
