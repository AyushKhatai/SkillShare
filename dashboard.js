
// Dashboard Logic

// Check Auth
if (!API.auth.isAuthenticated()) {
    window.location.href = 'login.html';
}

const user = API.getUser();
if (user) {
    const displayName = user.name || user.full_name || 'User';
    document.getElementById('userNameDisplay').textContent = displayName;
    document.getElementById('welcomeTitle').textContent = `Welcome back, ${displayName.split(' ')[0]}! 👋`;

    // Set avatar initial
    const avatarEl = document.getElementById('userAvatarDisplay');
    if (avatarEl) {
        avatarEl.textContent = displayName.charAt(0).toUpperCase();
    }
}

// State
let mySkills = [];
let myBookings = []; // As student
let teacherBookings = []; // As teacher

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setupModal();
    setupForms();
    setupSidebarNav();
    loadUnreadMessages();

    // Poll unread count every 10 seconds
    setInterval(loadUnreadMessages, 10000);
});

async function loadDashboardData() {
    try {
        // Load in parallel
        const [skillsRes, studentRes, teacherRes] = await Promise.all([
            API.skills.getMySkills().catch(e => { console.error('Skills error:', e); return { skills: [] }; }),
            API.bookings.getMyStudentBookings().catch(e => { console.error('Student bookings error:', e); return { bookings: [] }; }),
            API.bookings.getMyTeacherBookings().catch(e => { console.error('Teacher bookings error:', e); return { bookings: [] }; })
        ]);

        mySkills = Array.isArray(skillsRes) ? skillsRes : (skillsRes.skills || []);
        myBookings = Array.isArray(studentRes) ? studentRes : (studentRes.bookings || []);
        teacherBookings = Array.isArray(teacherRes) ? teacherRes : (teacherRes.bookings || []);

        console.log('Dashboard loaded:', { mySkills: mySkills.length, myBookings: myBookings.length, teacherBookings: teacherBookings.length });

        updateStats();
        renderMySkills();
        renderRequests();
        renderSessions();

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}

function updateStats() {
    // Skills count
    const skillsCount = document.getElementById('statSkills');
    if (skillsCount) skillsCount.textContent = mySkills.length;

    // Total sessions (confirmed + completed bookings from both roles)
    const allBookings = [...myBookings, ...teacherBookings];
    const totalSessions = allBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
    const sessionsCount = document.getElementById('statSessions');
    if (sessionsCount) sessionsCount.textContent = totalSessions;

    // Average rating
    const ratingEl = document.getElementById('statRating');
    if (ratingEl) {
        const ratings = mySkills.filter(s => s.average_rating > 0).map(s => parseFloat(s.average_rating));
        if (ratings.length > 0) {
            const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
            ratingEl.textContent = avg + '⭐';
        } else {
            ratingEl.textContent = '—';
        }
    }

    // Pending requests (shown to teacher)
    const pendingRequests = teacherBookings.filter(b => b.status === 'pending');
    const requestsEl = document.getElementById('statRequests');
    if (requestsEl) requestsEl.textContent = pendingRequests.length;

    // Badge
    const badge = document.getElementById('requestsCount');
    if (badge) {
        badge.textContent = pendingRequests.length;
        badge.style.display = pendingRequests.length > 0 ? 'inline-block' : 'none';
    }
}

function renderMySkills() {
    const list = document.getElementById('mySkillsList');
    if (mySkills.length === 0) {
        list.innerHTML = `
            <div class="dash-empty-state">
                <div class="dash-empty-icon">✨</div>
                <p>You haven't shared any skills yet.</p>
                <p style="font-size: 0.8125rem; margin-top: 0.5rem; color: var(--text-muted);">Click "Add New Skill" to get started!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = mySkills.map(skill => {
        const categoryClass = (skill.category || 'other').toLowerCase();
        return `
        <div class="skill-card">
            <h3>${escapeHtml(skill.title)}</h3>
            <span class="skill-category ${categoryClass}">${escapeHtml(skill.category)}</span>
            <p>${escapeHtml(skill.description)}</p>
            <div class="stats">
                <span>⭐ ${parseFloat(skill.average_rating || 0).toFixed(1)}</span>
                <span>👥 ${skill.total_bookings || 0} sessions</span>
                <span>📊 ${escapeHtml(skill.skill_level || '')}</span>
                ${skill.resume_link ? `<a href="${escapeHtml(skill.resume_link)}" target="_blank" style="color: var(--primary-color); text-decoration: none;" title="View Resume">📄 Link</a>` : `<span style="color: var(--text-muted); font-size: 0.8125rem;" title="No Resume Available">❌ None</span>`}
            </div>
        </div>
    `}).join('');
}

function renderRequests() {
    const list = document.getElementById('requestsList');

    // Requests TO me (as teacher) — pending
    const incomingRequests = teacherBookings.filter(b => b.status === 'pending');

    // Requests BY me (as student) — pending  
    const outgoingRequests = myBookings.filter(b => b.status === 'pending');

    if (incomingRequests.length === 0 && outgoingRequests.length === 0) {
        list.innerHTML = `
            <div class="dash-empty-state">
                <div class="dash-empty-icon">📬</div>
                <p>No pending requests</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Incoming requests (I'm the teacher)
    if (incomingRequests.length > 0) {
        html += `<div class="dash-request-group-label">📥 Incoming Requests</div>`;
        html += incomingRequests.map(req => `
            <div class="request-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <h4>${escapeHtml(req.skill_title || 'Skill')}</h4>
                        <p>From: <strong>${escapeHtml(req.student_name || 'Student')}</strong></p>
                        ${req.message ? `<p style="color: var(--text-muted); font-style: italic;">"${escapeHtml(req.message)}"</p>` : ''}
                        <p style="color: var(--text-muted); font-size: 0.8125rem;">📅 ${formatDate(req.booking_date)} ⏰ ${req.booking_time ? formatTime(req.booking_time) : ''}</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button class="btn btn-primary btn-sm" onclick="handleBooking(${req.booking_id}, 'confirmed')">✓ Accept</button>
                        <button class="btn btn-secondary btn-sm" onclick="handleBooking(${req.booking_id}, 'cancelled')">✕ Decline</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Outgoing requests (I'm the student)
    if (outgoingRequests.length > 0) {
        html += `<div class="dash-request-group-label">📤 My Requests (Awaiting Response)</div>`;
        html += outgoingRequests.map(req => `
            <div class="request-card" style="border-left: 4px solid var(--secondary-color);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <h4>${escapeHtml(req.skill_title || 'Skill')}</h4>
                        <p>Teacher: <strong>${escapeHtml(req.teacher_name || 'Teacher')}</strong></p>
                        ${req.message ? `<p style="color: var(--text-muted); font-style: italic;">"${escapeHtml(req.message)}"</p>` : ''}
                        <p style="color: var(--text-muted); font-size: 0.8125rem;">📅 ${formatDate(req.booking_date)} ⏰ ${req.booking_time ? formatTime(req.booking_time) : ''}</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center;">
                        <span class="dash-status-badge status-pending">⏳ Pending</span>
                        <button class="btn btn-ghost btn-sm" onclick="handleBooking(${req.booking_id}, 'cancelled')" title="Cancel request">✕</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    list.innerHTML = html;
}

// Session filter state
let sessionFilter = 'all';

function renderSessions() {
    const list = document.getElementById('sessionsList');

    // Sessions = confirmed or completed bookings from BOTH roles
    const studentSessions = myBookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .map(b => ({ ...b, role: 'student' }));

    const teacherSessions = teacherBookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .map(b => ({ ...b, role: 'teacher' }));

    let allSessions = [...studentSessions, ...teacherSessions];

    // Apply filter
    if (sessionFilter === 'student') {
        allSessions = allSessions.filter(s => s.role === 'student');
    } else if (sessionFilter === 'teacher') {
        allSessions = allSessions.filter(s => s.role === 'teacher');
    }

    allSessions.sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));

    if (allSessions.length === 0) {
        list.innerHTML = `
            <div class="dash-empty-state">
                <div class="dash-empty-icon">📅</div>
                <p>No sessions yet</p>
                <p style="font-size: 0.8125rem; margin-top: 0.5rem; color: var(--text-muted);">
                    Sessions appear here once a request is accepted
                </p>
            </div>
        `;
        return;
    }

    list.innerHTML = allSessions.map(session => {
        const isTeacher = session.role === 'teacher';
        const counterpart = isTeacher
            ? `Student: ${escapeHtml(session.student_name || 'Student')}`
            : `Teacher: ${escapeHtml(session.teacher_name || 'Teacher')}`;
        const roleBadgeBg = isTeacher ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)';
        const roleBadgeColor = isTeacher ? '#10b981' : '#8b5cf6';
        const roleLabel = isTeacher ? 'Teaching' : 'Learning';
        const statusClass = session.status === 'completed' ? 'status-completed' : 'status-confirmed';
        const statusLabel = session.status === 'completed' ? '✅ Completed' : '🟢 Confirmed';

        const counterpartId = isTeacher ? session.student_id : session.teacher_id;
        const counterpartName = isTeacher ? (session.student_name || 'Student') : (session.teacher_name || 'Teacher');
        const msgConvId = generateConversationId(currentUser.id || currentUser.user_id, counterpartId, session.booking_id);

        return `
        <div class="session-card">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div style="flex:1; min-width: 200px;">
                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.375rem; flex-wrap: wrap;">
                        <span class="dash-role-badge" style="background: ${roleBadgeBg}; color: ${roleBadgeColor};">${roleLabel}</span>
                        <span class="dash-status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <h4>${escapeHtml(session.skill_title || 'Session')}</h4>
                    <p>${counterpart}</p>
                    <p style="color: var(--text-muted); font-size: 0.8125rem;">📅 ${formatDate(session.booking_date)} ⏰ ${session.booking_time ? formatTime(session.booking_time) : ''}</p>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <a href="messages.html?conversation=${encodeURIComponent(msgConvId)}&receiver=${counterpartId}&name=${encodeURIComponent(counterpartName)}&skill=${encodeURIComponent(session.skill_title || '')}" class="btn btn-secondary btn-sm" style="text-decoration:none;">💬 Message</a>
                    ${(isTeacher && session.status === 'confirmed') ? `<button class="btn btn-primary btn-sm" onclick="handleBooking(${session.booking_id}, 'completed')">Mark Complete</button>` : ''}
                    ${(!isTeacher && session.status === 'completed') ? `<a href="reviews.html?skill_id=${session.skill_id}&skill_title=${encodeURIComponent(session.skill_title || 'Skill')}" class="btn btn-ghost btn-sm" style="text-decoration:none; color: #fbbf24;">⭐ Review</a>` : ''}
                </div>
            </div>
        </div>
    `}).join('');
}

// Helpers
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        // PostgreSQL returns dates like "2026-02-23T18:30:00.000Z"
        // Extract just the date part to avoid timezone shifting
        const dateOnly = String(dateStr).split('T')[0]; // "2026-02-23"
        const [year, month, day] = dateOnly.split('-').map(Number);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[month - 1]} ${year}`;
    } catch {
        return String(dateStr).split('T')[0] || dateStr;
    }
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    try {
        // Handle "12:00:00" or "12:00" format
        const parts = String(timeStr).split(':');
        let hours = parseInt(parts[0]);
        const minutes = parts[1] || '00';
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    } catch {
        return timeStr;
    }
}

// Sidebar navigation
function setupSidebarNav() {
    document.querySelectorAll('.dash-menu-item').forEach(item => {
        const link = item.querySelector('a');
        if (link && link.getAttribute('href')?.startsWith('#')) {
            link.addEventListener('click', (e) => {
                document.querySelectorAll('.dash-menu-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        }
    });
}

// Modal Logic
function setupModal() {
    const modal = document.getElementById('addSkillModal');
    const btn = document.getElementById('addSkillBtn');
    const close = document.getElementById('closeModal');

    if (btn) btn.onclick = () => { modal.style.display = "flex"; }
    if (close) close.onclick = () => { modal.style.display = "none"; }

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
}

function setupForms() {
    const form = document.getElementById('addSkillForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '⏳ Creating...';
            submitBtn.disabled = true;

            try {
                await API.skills.createSkill(data);
                document.getElementById('addSkillModal').style.display = "none";
                form.reset();
                const categorySelect = document.getElementById('categorySelect');
                if (categorySelect) categorySelect.dispatchEvent(new Event('change'));
                await loadDashboardData();
                submitBtn.innerHTML = '✅ Created!';
                setTimeout(() => { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }, 1500);
            } catch (error) {
                showToast('Failed to create skill: ' + error.message, 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        };

        const categorySelect = document.getElementById('categorySelect');
        const resumeLinkGroup = document.getElementById('resumeLinkGroup');
        const resumeLinkInput = document.getElementById('resumeLinkInput');
        
        if (categorySelect && resumeLinkGroup && resumeLinkInput) {
            categorySelect.addEventListener('change', (e) => {
                if (e.target.value === 'Programming') {
                    resumeLinkGroup.style.display = 'block';
                    resumeLinkInput.setAttribute('required', 'required');
                } else {
                    resumeLinkGroup.style.display = 'none';
                    resumeLinkInput.removeAttribute('required');
                    resumeLinkInput.value = '';
                }
            });
            // Initial state
            categorySelect.dispatchEvent(new Event('change'));
        }
    }
}

// Booking actions
window.handleBooking = async (id, status) => {
    const labels = { confirmed: 'accept', cancelled: 'cancel', completed: 'mark as complete' };
    const ok = await showConfirm(
        `Are you sure you want to ${labels[status] || status} this booking?`,
        'Confirm Action',
        'Yes, proceed',
        'Cancel'
    );
    if (!ok) return;

    try {
        await API.bookings.updateBookingStatus(id, status);
        showToast('Booking updated successfully!', 'success');
        await loadDashboardData();
    } catch (e) {
        showToast('Action failed: ' + e.message, 'error');
    }
};

window.filterSessions = (type) => {
    sessionFilter = type;
    // Tab UI toggle
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderSessions();
};

// ─── Message helpers for dashboard ─────
function generateConversationId(userId1, userId2, bookingId) {
    const sorted = [parseInt(userId1), parseInt(userId2)].sort((a, b) => a - b);
    return bookingId ? `${sorted[0]}_${sorted[1]}_b${bookingId}` : `${sorted[0]}_${sorted[1]}`;
}

async function loadUnreadMessages() {
    try {
        const res = await API.messages.getUnreadCount();
        const count = res.count || 0;
        const badge = document.getElementById('msgUnreadBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    } catch (e) {
        // Silently fail
    }
}

const currentUser = API.getUser();
