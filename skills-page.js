// Skills Page JavaScript

let filteredSkills = [];
let currentCategory = 'all';
let currentSort = 'popular';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    setupHamburger();
    checkUrlParams();
    fetchSkills();
    setupEventListeners();
});

// Setup Mobile Hamburger Menu
function setupHamburger() {
    const btn = document.getElementById('hamburgerBtn');
    const drawer = document.getElementById('navDrawer');
    if (btn && drawer) {
        btn.addEventListener('click', () => {
            drawer.classList.toggle('open');
            btn.classList.toggle('open');
        });
    }

    if (typeof API !== 'undefined' && API.auth && !API.auth.isAuthenticated()) {
        const logoutBtn = document.getElementById('navLogoutBtn');
        const profileLink = document.getElementById('navAuthProfile');
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileLink) {
            profileLink.textContent = 'Login';
            profileLink.href = 'login.html';
        }
    }
}

// Check for query parameters in URL (e.g., from AI matchmaker or landing page)
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    const catParam = params.get('category');

    if (searchParam) {
        const searchInput = document.getElementById('skillSearch');
        if (searchInput) searchInput.value = searchParam;
    }

    if (catParam) {
        currentCategory = catParam.toLowerCase();
        document.querySelectorAll('.browse-chip').forEach(chip => {
            if (chip.dataset.category === currentCategory) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }
}

// Fetch skills from API
async function fetchSkills() {
    const grid = document.getElementById('skillsGrid');
    const resultsCount = document.getElementById('resultsCount');

    try {
        grid.innerHTML = '<div class="browse-loading"><div class="browse-loading-spinner"></div><p>Loading skills...</p></div>';

        // Race API against a 12s timeout — prevents infinite spinner if backend is down
        const apiPromise = API.skills.getAllSkills();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Backend timeout — server may be offline')), 12000)
        );

        const response = await Promise.race([apiPromise, timeoutPromise]);
        filteredSkills = Array.isArray(response) ? response : (response.skills || response.data || []);
        renderSkills();
    } catch (error) {
        console.error('Error fetching skills:', error);
        filteredSkills = [];
        renderSkills();
        if (resultsCount) {
            resultsCount.textContent = 'Unable to reach backend';
        }
        if (typeof showToast === 'function') {
            showToast('Could not load skills from backend.', 'error');
        }
    }
}

// Render skills grid
function renderSkills() {
    const grid = document.getElementById('skillsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const searchInput = document.getElementById('skillSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // Apply filtering
    let displaySkills = filteredSkills.filter(skill => {
        const title = skill.title || skill.name || '';
        const desc = skill.description || '';
        const tutor = skill.teacher_name || skill.tutor_name || skill.tutor || '';

        const matchesSearch = !searchTerm || 
            title.toLowerCase().includes(searchTerm) ||
            desc.toLowerCase().includes(searchTerm) ||
            tutor.toLowerCase().includes(searchTerm);

        const skillCat = (skill.category || '').toLowerCase();
        const matchesCategory = currentCategory === 'all' || skillCat === currentCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    // Apply Sorting
    displaySkills.sort((a, b) => {
        if (currentSort === 'popular') return (b.total_bookings || 0) - (a.total_bookings || 0);
        if (currentSort === 'rating') return (parseFloat(b.average_rating) || 0) - (parseFloat(a.average_rating) || 0);
        if (currentSort === 'recent') return new Date(b.created_at) - new Date(a.created_at);
        if (currentSort === 'name') return (a.title || '').localeCompare(b.title || '');
        return 0;
    });

    if (displaySkills.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
                <div class="empty-state-icon" style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
                <h3>No matching skills found</h3>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Try adjusting your search keywords or explore the AI matchmaker.</p>
                <a href="ai-mentor.html" class="btn btn-ai-glow btn-sm" style="text-decoration: none;">✨ Ask AI Matchmaker</a>
            </div>
        `;
        resultsCount.textContent = 'No skills found';
        return;
    }

    resultsCount.textContent = `Showing ${displaySkills.length} skill${displaySkills.length !== 1 ? 's' : ''}`;

    grid.innerHTML = displaySkills.map(skill => {
        const title = escapeHtml(skill.title || skill.name);
        const category = skill.category || 'Other';
        const categoryClass = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const tutor = skill.teacher_name || skill.tutor_name || skill.tutor || 'Campus Tutor';
        const description = escapeHtml(skill.description || 'No description available.');
        const rating = parseFloat(skill.average_rating || 0).toFixed(1);
        const students = skill.total_bookings || 0;
        const level = skill.skill_level || 'All Levels';

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
                <div>
                    <span class="tutor-name">${escapeHtml(tutor)}</span>
                    <span style="font-size: 0.75rem; color: #10b981; display: block;">✓ Campus Verified</span>
                </div>
            </div>
            <div class="skill-meta">
                <div class="skill-rating-browse">
                    <span class="stars-browse">⭐</span>
                    <span class="rating-value">${rating}</span>
                </div>
                <span class="skill-students">👥 ${students} session${students !== 1 ? 's' : ''}</span>
            </div>
            <div class="skill-action" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn btn-primary" style="flex: 1; justify-content: center;" onclick="requestSkill('${skill.skill_id || skill.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Request Session
                </button>
                ${skill.resume_link ? `<a href="${escapeHtml(skill.resume_link)}" target="_blank" class="btn btn-secondary" style="padding: 0 0.8rem; display: flex; align-items: center; justify-content: center; text-decoration: none;" title="View Resume / Portfolio">📄</a>` : ''}
            </div>
        </div>
    `}).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Search — debounced
    const searchInput = document.getElementById('skillSearch');
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => renderSkills(), 180);
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

    // Setup modal close & submit
    setupBookingModal();
}

// Request skill function — opens modal
window.requestSkill = function (skillId) {
    if (!API.auth.isAuthenticated()) {
        showToast('Please login to request a session', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        return;
    }

    const skill = filteredSkills.find(s => String(s.skill_id || s.id) === String(skillId));
    const skillName = skill ? (skill.title || skill.name || 'Session') : 'Session';
    const tutorName = skill ? (skill.teacher_name || skill.tutor_name || 'Tutor') : 'Tutor';

    document.getElementById('bookingSkillId').value = skillId;
    document.getElementById('bookingSkillName').textContent = skillName;
    document.getElementById('bookingSkillTutor').textContent = 'with ' + tutorName;

    // Set default date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('bookingDate');
    dateInput.value = today;
    dateInput.min = today;

    // Reset form fields
    document.getElementById('bookingMessage').value = '';

    const modal = document.getElementById('bookingModal');
    modal.style.display = 'flex';
};

// Insert prep template
window.insertPrepTemplate = function() {
    const msgEl = document.getElementById('bookingMessage');
    if (msgEl) {
        msgEl.value = `Hi! I'd love to focus on:\n1. Core concepts & syntax\n2. Hands-on coding/practice problem\n3. Reviewing project/exam prep questions`;
    }
};

// Setup Booking Modal
function setupBookingModal() {
    const modal = document.getElementById('bookingModal');
    const closeBtn = document.getElementById('closeBookingModal');
    const form = document.getElementById('bookingForm');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const skillId = document.getElementById('bookingSkillId').value;

            // Guard against demo data
            if (typeof skillId === 'string' && skillId.startsWith('demo-')) {
                showToast('This is a sample skill — sign in and try a real listing to book.', 'info');
                return;
            }

            const date = document.getElementById('bookingDate').value;
            const hour = parseInt(document.getElementById('bookingHour').value);
            const minute = document.getElementById('bookingMinute').value;
            const ampm = document.getElementById('bookingAmpm').value;
            const message = document.getElementById('bookingMessage').value;

            if (!date) {
                showToast('Please select a date', 'warning');
                return;
            }

            let hour24 = hour;
            if (ampm === 'PM' && hour !== 12) hour24 = hour + 12;
            if (ampm === 'AM' && hour === 12) hour24 = 0;
            const timeStr = `${String(hour24).padStart(2, '0')}:${minute}`;

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending Request...';

            try {
                await API.bookings.createBooking({
                    skill_id: skillId,
                    booking_date: date,
                    booking_time: timeStr,
                    message: message || "I'd like to book a 1-on-1 session."
                });

                modal.style.display = 'none';
                showToast('Session request sent successfully! 🎉 Check your Dashboard.', 'success');
            } catch (error) {
                console.error('Booking failed:', error);
                showToast('Failed to send request: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Booking Request 🚀';
            }
        });
    }
}

// Helpers
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCategoryLabel(category) {
    const map = {
        'programming': 'Programming',
        'technical': 'Technical',
        'arts': 'Arts & Design',
        'arts & design': 'Arts & Design',
        'music': 'Music',
        'sports': 'Sports',
        'fitness': 'Fitness',
        'language': 'Language',
        'other': 'Other'
    };
    return map[category.toLowerCase()] || category;
}
