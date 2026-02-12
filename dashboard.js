
// Dashboard Logic

// Check Auth
if (!API.auth.isAuthenticated()) {
    window.location.href = 'login.html';
}

const user = API.getUser();
if (user) {
    document.getElementById('userNameDisplay').textContent = user.name || user.full_name || 'User';
    document.getElementById('welcomeTitle').textContent = `Welcome, ${user.name || user.full_name || 'Student'}! 👋`;
}

// State
let mySkills = [];
let myBookings = []; // As student
let teacherBookings = []; // As teacher

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setupModal();
    setupForms();
});

async function loadDashboardData() {
    try {
        // Load in parallel
        const [skillsRes, studentRes, teacherRes] = await Promise.all([
            API.skills.getMySkills().catch(e => []),
            API.bookings.getMyStudentBookings().catch(e => []),
            API.bookings.getMyTeacherBookings().catch(e => [])
        ]);

        mySkills = Array.isArray(skillsRes) ? skillsRes : (skillsRes.data || []);
        myBookings = Array.isArray(studentRes) ? studentRes : (studentRes.data || []);
        teacherBookings = Array.isArray(teacherRes) ? teacherRes : (teacherRes.data || []);

        renderMySkills();
        renderRequests();
        renderSessions();

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}

function renderMySkills() {
    const list = document.getElementById('mySkillsList');
    if (mySkills.length === 0) {
        list.innerHTML = '<p class="text-secondary">You haven\'t shared any skills yet.</p>';
        return;
    }

    list.innerHTML = mySkills.map(skill => `
        <div class="skill-card" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h3>${skill.title}</h3>
                <span class="skill-category ${skill.category.toLowerCase()}">${skill.category}</span>
                <p class="text-secondary">${skill.description}</p>
            </div>
            <div class="stats">
                <span>⭐ ${parseFloat(skill.average_rating || 0).toFixed(1)}</span>
                <span>👥 ${skill.total_bookings || 0} sessions</span>
            </div>
        </div>
    `).join('');
}

function renderRequests() {
    const list = document.getElementById('requestsList');
    // Requests are teacher bookings with status 'pending'
    const requests = teacherBookings.filter(b => b.status === 'pending');

    // Update badge (if I added one)
    const badge = document.getElementById('requestsCount');
    if (badge) {
        badge.textContent = requests.length;
        badge.style.display = requests.length > 0 ? 'inline-block' : 'none';
    }

    if (requests.length === 0) {
        list.innerHTML = '<p class="text-secondary">No pending requests.</p>';
        return;
    }

    list.innerHTML = requests.map(req => `
        <div class="feature-card request-card" style="padding: 1rem;">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <h4>Request for: ${req.skill_title || 'Skill'}</h4>
                    <p>From: ${req.student_name || 'Student'}</p>
                    <p class="text-secondary">Message: ${req.message || 'No message'}</p>
                    <p class="text-secondary">Date: ${req.booking_date} at ${req.booking_time}</p>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                    <button class="btn btn-primary btn-sm" onclick="handleBooking(${req.booking_id}, 'confirmed')">Accept</button>
                    <button class="btn btn-secondary btn-sm" onclick="handleBooking(${req.booking_id}, 'cancelled')">Decline</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderSessions() {
    const list = document.getElementById('sessionsList');

    // Confirmed sessions (both student and teacher)
    const studentSessions = myBookings.filter(b => b.status === 'confirmed').map(b => ({ ...b, role: 'student' }));
    const teacherSessions = teacherBookings.filter(b => b.status === 'confirmed').map(b => ({ ...b, role: 'teacher' }));

    const allSessions = [...studentSessions, ...teacherSessions].sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));

    if (allSessions.length === 0) {
        list.innerHTML = '<p class="text-secondary">No upcoming sessions.</p>';
        return;
    }

    list.innerHTML = allSessions.map(session => {
        const isTeacher = session.role === 'teacher';
        const counterpart = isTeacher ? `Student: ${session.student_name}` : `Tutor: ${session.teacher_name}`;

        return `
        <div class="feature-card session-card" style="padding: 1rem; border-left: 4px solid var(--primary-color);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4>${session.skill_title}</h4>
                    <span class="badge" style="background: ${isTeacher ? 'var(--secondary-color)' : 'var(--accent-color)'}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8em;">${isTeacher ? 'Teaching' : 'Learning'}</span>
                    <p>${counterpart}</p>
                    <p>📅 ${session.booking_date} ⏰ ${session.booking_time}</p>
                </div>
                <div>
                    ${isTeacher ? `<button class="btn btn-primary btn-sm" onclick="handleBooking(${session.booking_id}, 'completed')">End Session</button>` : ''}
                </div>
            </div>
        </div>
    `}).join('');
}

// Modal Logic
function setupModal() {
    const modal = document.getElementById('addSkillModal');
    const btn = document.getElementById('addSkillBtn');
    const close = document.getElementById('closeModal');

    if (btn) btn.onclick = () => { modal.style.display = "flex"; }
    if (close) close.onclick = () => { modal.style.display = "none"; }

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function setupForms() {
    const form = document.getElementById('addSkillForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                await API.skills.createSkill(data);
                alert("Skill created successfully!");
                document.getElementById('addSkillModal').style.display = "none";
                form.reset();
                loadDashboardData(); // Refresh
            } catch (error) {
                alert("Failed to create skill: " + error.message);
            }
        };
    }
}

// booking actions
window.handleBooking = async (id, status) => {
    if (!confirm(`Are you sure you want to mark this session as ${status}?`)) return;

    try {
        await API.bookings.updateBookingStatus(id, status);
        alert(`Session ${status}!`);
        loadDashboardData();
    } catch (e) {
        alert("Action failed: " + e.message);
    }
};

window.filterSessions = (type) => {
    // Implement client-side filtering logic here if needed
    // For now, loadDashboardData refreshes all, but we could filter 'allSessions' array
    // ... logic omitted for brevity, can just re-render
    alert("Filter functionality coming soon, showing all.");
};
