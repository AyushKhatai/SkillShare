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
        grid.innerHTML = '<div class="browse-loading"><div class="browse-loading-spinner"></div><p>Loading skills...</p></div>';

        const response = await API.skills.getAllSkills();
        console.log('Skills API response:', response);

        // FIX: API returns { skills: [...], count: N }
        filteredSkills = Array.isArray(response) ? response : (response.skills || response.data || []);
        console.log('Parsed skills:', filteredSkills.length, 'skills found');

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
        const tutor = skill.teacher_name || skill.tutor_name || skill.tutor || '';

        const matchesSearch = title.toLowerCase().includes(searchTerm) ||
            desc.toLowerCase().includes(searchTerm) ||
            tutor.toLowerCase().includes(searchTerm);

        const skillCat = (skill.category || '').toLowerCase();
        const matchesCategory = currentCategory === 'all' || skillCat === currentCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    // Sort
    displaySkills.sort((a, b) => {
        if (currentSort === 'popular') return (b.total_bookings || 0) - (a.total_bookings || 0);
        if (currentSort === 'rating') return (b.average_rating || 0) - (a.average_rating || 0);
        if (currentSort === 'recent') return new Date(b.created_at) - new Date(a.created_at);
        if (currentSort === 'name') return (a.title || '').localeCompare(b.title || '');
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
        const title = escapeHtml(skill.title || skill.name);
        const category = skill.category || 'Other';
        const categoryClass = category.toLowerCase();
        const tutor = skill.teacher_name || skill.tutor_name || skill.tutor || 'Unknown Tutor';
        const description = escapeHtml(skill.description || 'No description available.');
        const rating = parseFloat(skill.average_rating || 0).toFixed(1);
        const students = skill.total_bookings || 0;
        const level = skill.skill_level || '';

        // Initials
        let initials = 'T';
        if (tutor) {
            initials = tutor.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }

        return `
        <div class="skill-browse-card" data-skill-id="${skill.skill_id || skill.id}">
            <div class="skill-header-browse">
                <span class="skill-category ${categoryClass}">${escapeHtml(getCategoryLabel(category))}</span>
                ${level ? `<span class="skill-level-badge">${escapeHtml(level)}</span>` : ''}
            </div>
            <h3>${title}</h3>
            <p class="skill-description-browse">${description}</p>
            <div class="skill-tutor-info">
                <div class="tutor-avatar">${initials}</div>
                <span class="tutor-name">${escapeHtml(tutor)}</span>
            </div>
            <div class="skill-meta">
                <div class="skill-rating-browse">
                    <span class="stars-browse">⭐</span>
                    <span class="rating-value">${rating}</span>
                </div>
                <span class="skill-students">👥 ${students} student${students !== 1 ? 's' : ''}</span>
            </div>
            <div class="skill-action" style="display: flex; gap: 0.5rem;">
                <button class="btn btn-request" style="flex: 1;" onclick="requestSkill('${skill.skill_id || skill.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Request
                </button>
                ${skill.resume_link ? `<a href="${escapeHtml(skill.resume_link)}" target="_blank" class="btn btn-secondary" style="padding: 0 0.8rem; display: flex; align-items: center; justify-content: center; text-decoration: none;" title="View Resume">📄 Resume</a>` : `<button disabled class="btn btn-secondary" style="padding: 0 0.8rem; display: flex; align-items: center; justify-content: center; opacity: 0.5; cursor: not-allowed;" title="No Resume Available">❌ No Resume</button>`}
            </div>
        </div>
    `}).join('');
}

// HTML escaping for XSS prevention
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get category label
function getCategoryLabel(category) {
    const map = {
        'programming': 'Programming',
        'technical': 'Technical',
        'arts': 'Arts',
        'arts & design': 'Arts & Design',
        'music': 'Music',
        'sports': 'Sports',
        'fitness': 'Fitness',
        'language': 'Language',
        'other': 'Other'
    };
    return map[category.toLowerCase()] || category;
}

// Setup event listeners
function setupEventListeners() {
    // Search — debounced
    const searchInput = document.getElementById('skillSearch');
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => renderSkills(), 200);
        });
    }

    // Filter chips
    document.querySelectorAll('.browse-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            document.querySelectorAll('.browse-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderSkills();
        });
    });

    // Sort dropdown
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderSkills();
        });
    }
}

// Request skill function — opens modal
window.requestSkill = function (skillId) {
    if (!API.auth.isAuthenticated()) {
        showToast('Please login to request a session', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    // Find skill info from cached data
    const skill = filteredSkills.find(s => String(s.skill_id || s.id) === String(skillId));
    const skillName = skill ? (skill.title || skill.name || 'Session') : 'Session';
    const tutorName = skill ? (skill.teacher_name || skill.tutor_name || 'Tutor') : 'Tutor';

    // Populate modal
    document.getElementById('bookingSkillId').value = skillId;
    document.getElementById('bookingSkillName').textContent = skillName;
    document.getElementById('bookingSkillTutor').textContent = 'by ' + tutorName;

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').value = today;
    document.getElementById('bookingDate').min = today;

    // Reset time to 10:00 AM
    document.getElementById('bookingHour').value = '10';
    document.getElementById('bookingMinute').value = '00';
    document.getElementById('bookingAmPm').value = 'AM';

    // Reset message
    document.getElementById('bookingMessage').value = '';

    // Show modal
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'flex';
};

// Setup booking modal events
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('bookingModal');
    const closeBtn = document.getElementById('closeBookingModal');
    const submitBtn = document.getElementById('submitBookingBtn');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }

    // Close on overlay click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });

    // Submit booking
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const skillId = document.getElementById('bookingSkillId').value;
            const date = document.getElementById('bookingDate').value;
            const hour = parseInt(document.getElementById('bookingHour').value);
            const minute = document.getElementById('bookingMinute').value;
            const ampm = document.getElementById('bookingAmPm').value;
            const message = document.getElementById('bookingMessage').value;

            if (!date) {
                showToast('Please select a date', 'warning');
                return;
            }

            // Convert to 24-hour format for API
            let hour24 = hour;
            if (ampm === 'PM' && hour !== 12) hour24 = hour + 12;
            if (ampm === 'AM' && hour === 12) hour24 = 0;
            const timeStr = `${String(hour24).padStart(2, '0')}:${minute}`;

            // Disable button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                await API.bookings.createBooking({
                    skill_id: skillId,
                    booking_date: date,
                    booking_time: timeStr,
                    message: message || "I'd like to learn this skill."
                });

                modal.style.display = 'none';
                showToast('Session request sent successfully! 🎉', 'success');
            } catch (error) {
                console.error('Booking failed:', error);
                showToast('Failed to send request: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Send Request
                `;
            }
        });
    }
});
