// API Configuration and Service - Dynamic host detection
const API_BASE_URL = (function() {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const host = window.location.hostname;
        const port = window.location.port;

        // If loaded via file:// protocol
        if (protocol === 'file:') {
            return 'http://localhost:3001/api';
        }

        // Localhost development
        if (host === 'localhost' || host === '127.0.0.1' || host === '') {
            if (port === '3001') {
                return '/api';
            }
            // If served via Apache (80), Live Server (5500), etc.
            return 'http://localhost:3001/api';
        }
        if (window.SKILLSHARE_API_URL) return window.SKILLSHARE_API_URL;
        // Production / Vercel deployment:
        // Use a relative URL so all /api/* calls go through Vercel's
        // vercel.json rewrite rule and hit whatever backend is configured.
        return '/api';
    }
    return '/api';
})();

if (typeof window !== 'undefined') {
    window.API_BASE_URL = API_BASE_URL;
}

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

    const { headers: optionHeaders, ...restOptions } = options;

    const config = {
        ...restOptions,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...optionHeaders
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            // Handle expired/invalid token — auto logout
            if (response.status === 401 && data.message === 'Invalid token') {
                console.warn('Token expired or invalid — logging out');
                removeToken();
                removeUser();
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('login')) {
                    if (typeof showToast === 'function') {
                        showToast('Your session has expired. Please login again.', 'warning');
                    }
                    setTimeout(() => { window.location.href = '/login.html'; }, 1200);
                }
                throw new Error('Session expired');
            }
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

        if (data.token) {
            setToken(data.token);
        }
        if (data.user) {
            setUser(data.user);
        }

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
        if (data.user) {
            setUser(data.user);
        }

        return data;
    },

    // Google login
    googleLogin: async (googleToken) => {
        const data = await apiRequest('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ token: googleToken })
        });

        if (data.token) {
            setToken(data.token);
        }
        if (data.user) {
            setUser(data.user);
        }

        return data;
    },

    // Link password to Google account
    linkPassword: async (email, password) => {
        const data = await apiRequest('/auth/link-password', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token) {
            setToken(data.token);
        }
        if (data.user) {
            setUser(data.user);
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

// Messages API
const messagesAPI = {
    // Get all conversations
    getConversations: async () => {
        return await apiRequest('/messages/conversations');
    },

    // Get messages in a conversation
    getMessages: async (conversationId, limit = 50, offset = 0) => {
        return await apiRequest(`/messages/conversations/${conversationId}?limit=${limit}&offset=${offset}`);
    },

    // Send a message
    sendMessage: async (receiverId, content, bookingId = null, skillId = null) => {
        return await apiRequest('/messages/send', {
            method: 'POST',
            body: JSON.stringify({ receiverId, content, bookingId, skillId })
        });
    },

    // Start or get a conversation
    startConversation: async (receiverId, bookingId = null, skillId = null) => {
        return await apiRequest('/messages/start', {
            method: 'POST',
            body: JSON.stringify({ receiverId, bookingId, skillId })
        });
    },

    // Mark conversation as read
    markRead: async (conversationId) => {
        return await apiRequest(`/messages/read/${conversationId}`, {
            method: 'PUT'
        });
    },

    // Get unread message count
    getUnreadCount: async () => {
        return await apiRequest('/messages/unread');
    },

    // Delete a message
    deleteMessage: async (messageId) => {
        return await apiRequest(`/messages/${messageId}`, {
            method: 'DELETE'
        });
    }
};

// AI Services API
const aiAPI = {
    // Match skills & tutors based on natural language query
    match: async (query, level = 'all', category = 'all') => {
        return await apiRequest('/ai/match', {
            method: 'POST',
            body: JSON.stringify({ query, level, category })
        });
    },

    // Generate a 4-week personalized learning roadmap
    generateRoadmap: async (topic, currentLevel = 'Beginner', targetGoal = '', hoursPerWeek = 5) => {
        return await apiRequest('/ai/roadmap', {
            method: 'POST',
            body: JSON.stringify({ topic, currentLevel, targetGoal, hoursPerWeek })
        });
    },

    // Enhance skill listing for tutors
    enhanceSkill: async (title, category = '', skill_level = '', notes = '') => {
        return await apiRequest('/ai/enhance-skill', {
            method: 'POST',
            body: JSON.stringify({ title, category, skill_level, notes })
        });
    },

    // Generate diagnostic quiz
    generateQuiz: async (topic, level = 'Beginner') => {
        return await apiRequest('/ai/quiz', {
            method: 'POST',
            body: JSON.stringify({ topic, level })
        });
    },

    // Chat with AI campus mentor
    chatMentor: async (message, conversationHistory = []) => {
        return await apiRequest('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message, conversationHistory })
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
    messages: messagesAPI,
    ai: aiAPI,
    getToken,
    setToken,
    removeToken,
    getUser,
    setUser,
    removeUser
};
