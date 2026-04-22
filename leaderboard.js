// ========================================
// LEADERBOARD PAGE LOGIC
// ========================================

let allSkillsData = [];
let leaderboardData = [];
let activeCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    setupFilters();
});

async function loadLeaderboard() {
    try {
        const res = await API.skills.getAllSkills();
        allSkillsData = Array.isArray(res) ? res : (res.skills || []);
        processLeaderboard();
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('lbPodium').innerHTML = '<div class="lb-empty"><div class="lb-empty-icon">😕</div><p>Could not load leaderboard data</p></div>';
        document.getElementById('lbRankings').innerHTML = '';
    }
}

function processLeaderboard() {
    // Filter by category if active
    let skills = allSkillsData;
    if (activeCategory !== 'all') {
        skills = skills.filter(s => (s.category || '').toLowerCase() === activeCategory);
    }

    // Aggregate by user
    const userMap = {};
    skills.forEach(skill => {
        const userId = skill.user_id;
        if (!userMap[userId]) {
            userMap[userId] = {
                userId,
                name: skill.user_name || skill.teacher_name || 'Unknown',
                skills: [],
                totalSessions: 0,
                totalRatingSum: 0,
                ratedSkills: 0
            };
        }
        userMap[userId].skills.push(skill);
        userMap[userId].totalSessions += (skill.total_bookings || 0);
        if (skill.average_rating > 0) {
            userMap[userId].totalRatingSum += parseFloat(skill.average_rating);
            userMap[userId].ratedSkills++;
        }
    });

    // Compute scores and sort
    leaderboardData = Object.values(userMap).map(u => {
        const avgRating = u.ratedSkills > 0 ? u.totalRatingSum / u.ratedSkills : 0;
        // Composite score: weighted combination
        const score = (u.skills.length * 10) + (u.totalSessions * 5) + (avgRating * 20);
        return { ...u, avgRating, score };
    });

    leaderboardData.sort((a, b) => b.score - a.score);

    // Update top stats
    document.getElementById('lbTotalTutors').textContent = leaderboardData.length;
    document.getElementById('lbTotalSkills').textContent = skills.length;
    const totalSessions = leaderboardData.reduce((sum, u) => sum + u.totalSessions, 0);
    document.getElementById('lbTotalSessions').textContent = totalSessions;

    renderPodium();
    renderRankings();
}

function renderPodium() {
    const container = document.getElementById('lbPodium');
    const top3 = leaderboardData.slice(0, 3);

    if (top3.length === 0) {
        container.innerHTML = '<div class="lb-empty"><div class="lb-empty-icon">🏆</div><p>No tutors found for this category yet</p></div>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const avatarGradients = [
        'linear-gradient(135deg, #fbbf24, #f59e0b)',
        'linear-gradient(135deg, #9ca3af, #6b7280)',
        'linear-gradient(135deg, #d97706, #b45309)'
    ];

    // Pad to 3 if needed
    while (top3.length < 3) {
        top3.push(null);
    }

    // Render in order: 2nd, 1st, 3rd for podium layout
    const podiumOrder = [1, 0, 2];
    container.innerHTML = podiumOrder.map(i => {
        const user = top3[i];
        if (!user) return '';
        const initial = user.name.charAt(0).toUpperCase();
        const rating = user.avgRating > 0 ? user.avgRating.toFixed(1) : '—';
        return `
            <div class="lb-podium-card rank-${i + 1}">
                <div class="lb-podium-medal">${medals[i]}</div>
                <div class="lb-podium-avatar" style="background: ${avatarGradients[i]};">${initial}</div>
                <div class="lb-podium-name">${escapeHtml(user.name)}</div>
                <div class="lb-podium-skills">${user.skills.length} skill${user.skills.length !== 1 ? 's' : ''}</div>
                <div class="lb-podium-stats">
                    <span class="lb-podium-stat">⭐ ${rating}</span>
                    <span class="lb-podium-stat">📚 ${user.totalSessions}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderRankings() {
    const container = document.getElementById('lbRankings');

    if (leaderboardData.length === 0) {
        container.innerHTML = '<div class="lb-empty"><p>No rankings available</p></div>';
        return;
    }

    const avatarColors = ['#7c3aed', '#d946ef', '#06b6d4', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    container.innerHTML = leaderboardData.map((user, index) => {
        const initial = user.name.charAt(0).toUpperCase();
        const rating = user.avgRating > 0 ? user.avgRating.toFixed(1) : '—';
        const colorIndex = index % avatarColors.length;
        const skillNames = user.skills.slice(0, 3).map(s => s.title).join(', ');
        const extraCount = user.skills.length > 3 ? ` +${user.skills.length - 3} more` : '';

        return `
            <div class="lb-rank-row" style="animation-delay: ${index * 0.05}s;">
                <span class="lb-rank-number">#${index + 1}</span>
                <div class="lb-rank-avatar" style="background: ${avatarColors[colorIndex]};">${initial}</div>
                <div class="lb-rank-info">
                    <div class="lb-rank-name">${escapeHtml(user.name)}</div>
                    <div class="lb-rank-detail">${escapeHtml(skillNames)}${extraCount}</div>
                </div>
                <div class="lb-rank-stats">
                    <span class="lb-rank-stat">⭐ <strong>${rating}</strong></span>
                    <span class="lb-rank-stat">📚 <strong>${user.totalSessions}</strong></span>
                    <span class="lb-rank-stat">🎯 <strong>${user.skills.length}</strong></span>
                </div>
            </div>
        `;
    }).join('');
}

function setupFilters() {
    document.querySelectorAll('.lb-filter-chips .browse-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.lb-filter-chips .browse-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategory = chip.dataset.category;
            processLeaderboard();
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
