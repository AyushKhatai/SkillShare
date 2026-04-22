// ========================================
// PROFILE PAGE LOGIC
// ========================================

// Auth check
if (!API.auth.isAuthenticated()) {
    window.location.href = 'login.html';
}

const currentUser = API.getUser();
if (currentUser) {
    const displayName = currentUser.name || currentUser.full_name || 'User';
    document.getElementById('userNameDisplay').textContent = displayName;
    const avatarEl = document.getElementById('userAvatarDisplay');
    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
}

// State
let profileSkills = [];
let profileStudentBookings = [];
let profileTeacherBookings = [];

document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    setupEditModal();
});

async function loadProfileData() {
    try {
        const [profileRes, skillsRes, studentRes, teacherRes] = await Promise.all([
            API.users.getProfile().catch(() => null),
            API.skills.getMySkills().catch(() => ({ skills: [] })),
            API.bookings.getMyStudentBookings().catch(() => ({ bookings: [] })),
            API.bookings.getMyTeacherBookings().catch(() => ({ bookings: [] }))
        ]);

        // Profile info
        const profile = profileRes?.user || profileRes || currentUser;
        if (profile) {
            const name = profile.full_name || profile.name || 'User';
            document.getElementById('profileName').textContent = name;
            document.getElementById('profileEmail').textContent = profile.email || '';
            document.getElementById('profileAvatar').textContent = name.charAt(0).toUpperCase();
            
            const deptEl = document.getElementById('profileDepartment');
            if (deptEl && profile.department) {
                deptEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg> ${escapeHtml(profile.department)}`;
            }

            const joinedEl = document.getElementById('profileJoined');
            if (joinedEl && profile.created_at) {
                const joinDate = new Date(profile.created_at);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                joinedEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Joined ${months[joinDate.getMonth()]} ${joinDate.getFullYear()}`;
            }

            const bioEl = document.getElementById('profileBio');
            if (bioEl && profile.bio) {
                bioEl.textContent = profile.bio;
            }

            // Prefill edit form
            document.getElementById('editName').value = profile.full_name || profile.name || '';
            document.getElementById('editDepartment').value = profile.department || '';
            document.getElementById('editBio').value = profile.bio || '';
        }

        // Skills
        profileSkills = Array.isArray(skillsRes) ? skillsRes : (skillsRes.skills || []);
        profileStudentBookings = Array.isArray(studentRes) ? studentRes : (studentRes.bookings || []);
        profileTeacherBookings = Array.isArray(teacherRes) ? teacherRes : (teacherRes.bookings || []);

        renderProfileStats();
        renderProfileSkills();
        renderTimeline();

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function renderProfileStats() {
    document.getElementById('profileStatSkills').textContent = profileSkills.length;

    const allBookings = [...profileStudentBookings, ...profileTeacherBookings];
    const sessions = allBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    document.getElementById('profileStatSessions').textContent = sessions.length;

    const teaching = profileTeacherBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    document.getElementById('profileStatTeaching').textContent = teaching.length;

    const ratings = profileSkills.filter(s => s.average_rating > 0).map(s => parseFloat(s.average_rating));
    const ratingEl = document.getElementById('profileStatRating');
    if (ratings.length > 0) {
        const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
        ratingEl.textContent = avg + '⭐';
    } else {
        ratingEl.textContent = '—';
    }
}

function renderProfileSkills() {
    const container = document.getElementById('profileSkillsList');
    if (profileSkills.length === 0) {
        container.innerHTML = `
            <div class="dash-empty-state" style="grid-column: 1/-1;">
                <div class="dash-empty-icon">✨</div>
                <p>No skills shared yet</p>
                <a href="dashboard.html#my-skills" class="btn btn-primary btn-sm" style="margin-top:0.75rem;">Add a Skill</a>
            </div>
        `;
        return;
    }

    const categoryIcons = {
        'Programming': '💻', 'Arts & Design': '🎨', 'Music': '🎵',
        'Sports': '⚽', 'Fitness': '💪', 'Language': '🌐', 'Other': '✨'
    };

    container.innerHTML = profileSkills.map(skill => {
        const icon = categoryIcons[skill.category] || '📚';
        const rating = parseFloat(skill.average_rating || 0).toFixed(1);
        return `
            <div class="profile-skill-chip">
                <div class="profile-skill-emoji">${icon}</div>
                <div class="profile-skill-info">
                    <h4>${escapeHtml(skill.title)}</h4>
                    <p>⭐ ${rating} · ${skill.total_bookings || 0} sessions</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderTimeline() {
    const container = document.getElementById('profileTimeline');
    const allBookings = [
        ...profileStudentBookings.map(b => ({ ...b, role: 'student' })),
        ...profileTeacherBookings.map(b => ({ ...b, role: 'teacher' }))
    ];

    if (allBookings.length === 0) {
        container.innerHTML = `
            <div class="dash-empty-state">
                <div class="dash-empty-icon">📋</div>
                <p>No activity yet</p>
                <p style="font-size: 0.8125rem; margin-top: 0.5rem; color: var(--text-muted);">Your sessions and bookings will appear here</p>
            </div>
        `;
        return;
    }

    // Sort by date, newest first
    allBookings.sort((a, b) => new Date(b.booking_date || b.created_at) - new Date(a.booking_date || a.created_at));

    // Show max 10
    const recent = allBookings.slice(0, 10);

    container.innerHTML = recent.map(booking => {
        const isTeacher = booking.role === 'teacher';
        const counterpart = isTeacher ? (booking.student_name || 'Student') : (booking.teacher_name || 'Teacher');
        const action = isTeacher
            ? (booking.status === 'completed' ? 'Taught' : booking.status === 'confirmed' ? 'Teaching' : booking.status === 'pending' ? 'Request from' : 'Cancelled with')
            : (booking.status === 'completed' ? 'Learned from' : booking.status === 'confirmed' ? 'Learning from' : booking.status === 'pending' ? 'Requested' : 'Cancelled with');
        
        const dateStr = booking.booking_date
            ? formatDateShort(booking.booking_date)
            : 'Date TBD';

        return `
            <div class="timeline-item">
                <div class="timeline-dot ${booking.status}"></div>
                <div class="timeline-content">
                    <div class="timeline-title">${action} <strong>${escapeHtml(counterpart)}</strong> — ${escapeHtml(booking.skill_title || 'Session')}</div>
                    <div class="timeline-meta">${dateStr} · ${capitalize(booking.status)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Helpers
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    try {
        const dateOnly = String(dateStr).split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[month - 1]} ${year}`;
    } catch {
        return dateStr;
    }
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// Edit Modal
function setupEditModal() {
    const modal = document.getElementById('editProfileModal');
    const openBtn = document.getElementById('editProfileBtn');
    const closeBtn = document.getElementById('closeEditModal');

    if (openBtn) openBtn.onclick = () => { modal.style.display = 'flex'; };
    if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') modal.style.display = 'none';
    });

    const form = document.getElementById('editProfileForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '⏳ Saving...';
            submitBtn.disabled = true;

            try {
                await API.users.updateProfile(data);
                // Update localStorage user
                const user = API.getUser();
                if (user) {
                    user.full_name = data.full_name;
                    user.name = data.full_name;
                    user.department = data.department;
                    user.bio = data.bio;
                    API.setUser(user);
                }
                modal.style.display = 'none';
                showToast('Profile updated successfully!', 'success');
                await loadProfileData();
                submitBtn.innerHTML = '✅ Saved!';
                setTimeout(() => { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }, 1500);
            } catch (error) {
                showToast('Failed to update profile: ' + error.message, 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        };
    }
}
