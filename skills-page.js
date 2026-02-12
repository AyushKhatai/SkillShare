// Skills Page JavaScript

let filteredSkills = [];
let currentCategory = 'all';
let currentSort = 'popular';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    fetchSkills();
    setupEventListeners();
});

// Fetch skills from API
async function fetchSkills() {
    const grid = document.getElementById('skillsGrid');
    const resultsCount = document.getElementById('resultsCount');

    try {
        grid.innerHTML = '<div class="loading">Loading skills...</div>';

        const response = await API.skills.getAllSkills();
        // Assuming API returns an array, or object with data property
        filteredSkills = Array.isArray(response) ? response : (response.data || []);

        renderSkills();
    } catch (error) {
        console.error('Error fetching skills:', error);
        grid.innerHTML = `<div class="error-state">Failed to load skills. Please try again.</div>`;
        resultsCount.textContent = 'Error loading skills';
    }
}

// Render skills grid
function renderSkills() {
    const grid = document.getElementById('skillsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const searchInput = document.getElementById('skillSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    // Apply local filtering/sorting on the fetched data
    let displaySkills = filteredSkills.filter(skill => {
        const title = skill.title || skill.name || '';
        const desc = skill.description || '';
        const tutor = skill.tutor_name || skill.tutor || '';

        const matchesSearch = title.toLowerCase().includes(searchTerm) ||
            desc.toLowerCase().includes(searchTerm) ||
            tutor.toLowerCase().includes(searchTerm);

        const matchesCategory = currentCategory === 'all' || (skill.category || '').toLowerCase() === currentCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    // Sort
    displaySkills.sort((a, b) => {
        if (currentSort === 'popular') return (b.students || b.total_bookings || 0) - (a.students || a.total_bookings || 0);
        if (currentSort === 'rating') return (b.average_rating || b.rating || 0) - (a.average_rating || a.rating || 0);
        if (currentSort === 'recent') return new Date(b.created_at) - new Date(a.created_at);
        if (currentSort === 'name') return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        return 0;
    });

    if (displaySkills.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>No skills found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        resultsCount.textContent = 'No skills found';
        return;
    }

    resultsCount.textContent = `Showing ${displaySkills.length} skill${displaySkills.length !== 1 ? 's' : ''}`;

    grid.innerHTML = displaySkills.map(skill => {
        const title = skill.title || skill.name;
        const category = skill.category || 'Other';
        const tutor = skill.tutor_name || skill.tutor || 'Unknown Tutor';
        const description = skill.description || 'No description available.';
        const rating = parseFloat(skill.average_rating || skill.rating || 0).toFixed(1);
        const students = skill.total_bookings || skill.students || 0;

        // Initials
        let initials = 'T';
        if (tutor) {
            initials = tutor.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }

        return `
        <div class="skill-browse-card" data-skill-id="${skill.skill_id || skill.id}">
            <div class="skill-header-browse">
                <span class="skill-category ${category.toLowerCase()}">${getCategoryLabel(category)}</span>
            </div>
            <h3>${title}</h3>
            <p class="skill-description-browse">${description}</p>
            <div class="skill-tutor-info">
                <div class="tutor-avatar">${initials}</div>
                <span class="tutor-name">${tutor}</span>
            </div>
            <div class="skill-meta">
                <div class="skill-rating-browse">
                    <span class="stars-browse">⭐</span>
                    <span class="rating-value">${rating}</span>
                </div>
                <span class="skill-students">👥 ${students} students</span>
            </div>
            <div class="skill-action">
                <button class="btn btn-request" onclick="requestSkill('${skill.skill_id || skill.id}')">
                    Request Session
                </button>
            </div>
        </div>
    `}).join('');
}

// Get category label
function getCategoryLabel(category) {
    const labels = {
        technical: 'Technical',
        arts: 'Arts',
        sports: 'Sports',
        fitness: 'Fitness',
        other: 'Other'
    };
    return labels[category.toLowerCase()] || category;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('skillSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderSkills();
        });
    }

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderSkills();
        });
    });

    // Sort functionality
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderSkills();
        });
    }
}

// Request skill function
window.requestSkill = async function (skillId) {
    if (!API.auth.isAuthenticated()) {
        alert("Please login to request a session.");
        window.location.href = 'login.html';
        return;
    }

    const date = prompt("Enter preferred date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!date) return;

    const time = prompt("Enter preferred time (HH:MM):", "10:00");
    if (!time) return;

    const message = prompt("Any message for the tutor?", "I'd like to learn this skill.");

    try {
        await API.bookings.createBooking({
            skill_id: skillId,
            booking_date: date,
            booking_time: time,
            message: message
        });
        alert("Request sent successfully!");
    } catch (error) {
        console.error("Booking failed:", error);
        alert("Failed to book session: " + error.message);
    }
};

// Helper for notifications if used elsewhere
function showNotification(msg, type) {
    alert(msg);
}
