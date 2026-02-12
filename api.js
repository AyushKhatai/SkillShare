// API Configuration and Service
const API_BASE_URL = 'http://localhost:3001/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set token in localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Remove token from localStorage
const removeToken = () => localStorage.removeItem('token');

// Get user data from localStorage
const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Set user data in localStorage
const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));

// Remove user data from localStorage
const removeUser = () => localStorage.removeItem('user');

// Generic API request function
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
const authAPI = {
    // Register new user
    register: async (userData) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return data;
    },

    // Login user
    login: async (credentials) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (data.token) {
            setToken(data.token);
        }

        return data;
    },

    // Logout user
    logout: () => {
        removeToken();
        removeUser();
        window.location.href = '/index.html';
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!getToken();
    }
};

// Users API
const usersAPI = {
    // Get current user profile
    getProfile: async () => {
        return await apiRequest('/users/profile');
    },

    // Update user profile
    updateProfile: async (userData) => {
        return await apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    // Get user by ID
    getUserById: async (userId) => {
        return await apiRequest(`/users/${userId}`);
    },

    // Get all users
    getAllUsers: async () => {
        return await apiRequest('/users/all');
    },

    // Delete account
    deleteAccount: async () => {
        return await apiRequest('/users/account', {
            method: 'DELETE'
        });
    }
};

// Skills API
const skillsAPI = {
    // Get all skills with optional filters
    getAllSkills: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/skills?${queryParams}` : '/skills';
        return await apiRequest(endpoint);
    },

    // Get skill by ID
    getSkillById: async (skillId) => {
        return await apiRequest(`/skills/${skillId}`);
    },

    // Get skills by user ID
    getSkillsByUserId: async (userId) => {
        return await apiRequest(`/skills/user/${userId}`);
    },

    // Get current user's skills
    getMySkills: async () => {
        return await apiRequest('/skills/my/skills');
    },

    // Create new skill
    createSkill: async (skillData) => {
        return await apiRequest('/skills', {
            method: 'POST',
            body: JSON.stringify(skillData)
        });
    },

    // Update skill
    updateSkill: async (skillId, skillData) => {
        return await apiRequest(`/skills/${skillId}`, {
            method: 'PUT',
            body: JSON.stringify(skillData)
        });
    },

    // Delete skill
    deleteSkill: async (skillId) => {
        return await apiRequest(`/skills/${skillId}`, {
            method: 'DELETE'
        });
    }
};

// Bookings API
const bookingsAPI = {
    // Get all bookings for current user
    getMyBookings: async () => {
        return await apiRequest('/bookings');
    },

    // Get bookings as student
    getMyStudentBookings: async () => {
        return await apiRequest('/bookings/student');
    },

    // Get bookings as teacher
    getMyTeacherBookings: async () => {
        return await apiRequest('/bookings/teacher');
    },

    // Get booking by ID
    getBookingById: async (bookingId) => {
        return await apiRequest(`/bookings/${bookingId}`);
    },

    // Create new booking
    createBooking: async (bookingData) => {
        return await apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    },

    // Update booking status
    updateBookingStatus: async (bookingId, status) => {
        return await apiRequest(`/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    // Delete booking
    deleteBooking: async (bookingId) => {
        return await apiRequest(`/bookings/${bookingId}`, {
            method: 'DELETE'
        });
    },

    // Get bookings for a skill
    getBookingsBySkill: async (skillId) => {
        return await apiRequest(`/bookings/skill/${skillId}`);
    }
};

// Reviews API
const reviewsAPI = {
    // Get reviews for a skill
    getReviewsBySkill: async (skillId) => {
        return await apiRequest(`/reviews/skill/${skillId}`);
    },

    // Get current user's reviews
    getMyReviews: async () => {
        return await apiRequest('/reviews/my');
    },

    // Create new review
    createReview: async (reviewData) => {
        return await apiRequest('/reviews', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    },

    // Update review
    updateReview: async (reviewId, reviewData) => {
        return await apiRequest(`/reviews/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify(reviewData)
        });
    },

    // Delete review
    deleteReview: async (reviewId) => {
        return await apiRequest(`/reviews/${reviewId}`, {
            method: 'DELETE'
        });
    }
};

// Export all APIs
window.API = {
    auth: authAPI,
    users: usersAPI,
    skills: skillsAPI,
    bookings: bookingsAPI,
    reviews: reviewsAPI,
    getToken,
    setToken,
    removeToken,
    getUser,
    setUser,
    removeUser
};
