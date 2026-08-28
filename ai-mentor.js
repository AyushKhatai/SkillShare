// SkillSense AI Mentor Page Logic

let chatHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    setupTabSwitching();
    setupAuthNavbar();
});

// ─── 1. Tab Switching ───────────────────────────────────────────────
function setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.ai-tab-btn');
    const panels = document.querySelectorAll('.ai-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// ─── 2. Auth State in Navbar ─────────────────────────────────────────
function setupAuthNavbar() {
    if (typeof API === 'undefined' || !API.auth) return;
    const isLoggedIn = API.auth.isAuthenticated();
    const user = API.getUser();

    const loginBtn = document.getElementById('navAuthLogin');
    const registerBtn = document.getElementById('navAuthRegister');
    const dashBtn = document.getElementById('navAuthDashboard');

    if (isLoggedIn && user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (dashBtn) {
            dashBtn.style.display = '';
            dashBtn.textContent = `👋 Dashboard`;
        }
    }
}

// ─── 3. AI Chat Mentor ───────────────────────────────────────────────
async function handleChatSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    appendChatMessage('user', message);
    chatHistory.push({ sender: 'user', text: message });

    // Add typing indicator
    const typingId = showTypingIndicator();

    try {
        const response = await API.ai.chatMentor(message, chatHistory);
        removeTypingIndicator(typingId);

        const reply = response.reply || "I'm here to help! Let me know what skills or tutors you'd like to explore.";
        appendChatMessage('bot', reply);
        chatHistory.push({ sender: 'bot', text: reply });

    } catch (error) {
        removeTypingIndicator(typingId);
        appendChatMessage('bot', "⚠️ I ran into an issue connecting to the AI mentor. You can still explore all skills on the Browse Skills page!");
    }
}

function sendPrompt(promptText) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = promptText;
        document.getElementById('chatForm').dispatchEvent(new Event('submit'));
    }
}

function appendChatMessage(sender, text) {
    const messagesArea = document.getElementById('chatMessagesArea');
    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${sender}`;
    
    // Format simple markdown (bold, newlines)
    const formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    msgEl.innerHTML = formatted;
    messagesArea.appendChild(msgEl);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function showTypingIndicator() {
    const messagesArea = document.getElementById('chatMessagesArea');
    const id = 'typing-' + Date.now();
    const typingEl = document.createElement('div');
    typingEl.id = id;
    typingEl.className = 'chat-msg bot';
    typingEl.innerHTML = '<em>Aura is thinking... ✨</em>';
    messagesArea.appendChild(typingEl);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function clearChat() {
    chatHistory = [];
    const messagesArea = document.getElementById('chatMessagesArea');
    messagesArea.innerHTML = `
        <div class="chat-msg bot">
            Chat cleared! What would you like to learn today? 🚀
        </div>
    `;
}

// ─── 4. Smart Tutor Matchmaker ──────────────────────────────────────
async function handleMatchSubmit(event) {
    event.preventDefault();
    const query = document.getElementById('matchQuery').value.trim();
    const category = document.getElementById('matchCategory').value;
    const level = document.getElementById('matchLevel').value;
    const btn = document.getElementById('matchSubmitBtn');
    const resultsArea = document.getElementById('matchResultsArea');
    const grid = document.getElementById('matchGrid');
    const summary = document.getElementById('matchAiSummary');

    if (!query) return;

    btn.disabled = true;
    btn.innerHTML = '⏳ Matching with Campus Tutors...';
    resultsArea.style.display = 'block';
    grid.innerHTML = '<div class="skeleton" style="height: 200px; grid-column: 1/-1;"></div>';
    summary.innerHTML = 'Analyzing tutor availability, course ratings, and expertise...';

    try {
        const data = await API.ai.match(query, level, category);
        btn.disabled = false;
        btn.innerHTML = '✨ Find My Best Tutor Match';

        summary.innerHTML = `💡 <strong>AI Match Analysis:</strong> ${escapeHtml(data.aiSummary || '')}`;

        if (!data.matches || data.matches.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                    <p style="color: var(--text-muted);">No exact tutor matches found. Try searching with broader keywords or browse all skills.</p>
                    <a href="skills.html" class="btn btn-secondary" style="margin-top: 1rem;">Browse All Skills</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = data.matches.map(m => {
            const score = m.match_score || 85;
            const rating = parseFloat(m.average_rating || 0).toFixed(1);
            return `
                <div class="ai-match-card">
                    <span class="ai-score-pill">${score}% Match</span>
                    <div>
                        <span class="roadmap-badge" style="margin-bottom: 0.5rem; display: inline-block;">${escapeHtml(m.category || 'General')}</span>
                        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.25rem;">${escapeHtml(m.title)}</h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Taught by <strong>${escapeHtml(m.teacher_name || 'Tutor')}</strong> (${escapeHtml(m.department || 'Campus Peer')})</p>
                        
                        <div class="ai-reasoning-box">
                            <strong>Why matched:</strong> ${escapeHtml(m.reasoning || m.description)}
                        </div>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 1rem; color: var(--text-muted);">
                            <span>⭐ ${rating} (${m.total_bookings || 0} sessions)</span>
                            <span>📊 ${escapeHtml(m.skill_level || 'All levels')}</span>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <a href="skills.html?search=${encodeURIComponent(m.title)}" class="btn btn-primary btn-sm" style="flex: 1; justify-content: center; text-decoration: none;">
                                View & Request →
                            </a>
                            ${m.resume_link ? `<a href="${escapeHtml(m.resume_link)}" target="_blank" class="btn btn-secondary btn-sm" title="View Resume">📄</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        btn.disabled = false;
        btn.innerHTML = '✨ Find My Best Tutor Match';
        showToast('Failed to find matches: ' + error.message, 'error');
        grid.innerHTML = `<div style="grid-column: 1/-1; color: var(--text-muted);">Could not complete AI match. Please try again.</div>`;
    }
}

// ─── 5. 4-Week Roadmap Generator ────────────────────────────────────
async function handleRoadmapSubmit(event) {
    event.preventDefault();
    const topic = document.getElementById('roadmapTopic').value.trim();
    const level = document.getElementById('roadmapLevel').value;
    const goal = document.getElementById('roadmapGoal').value.trim();
    const hours = document.getElementById('roadmapHours').value;
    const btn = document.getElementById('roadmapSubmitBtn');
    const resultsArea = document.getElementById('roadmapResultsArea');

    if (!topic) return;

    btn.disabled = true;
    btn.innerHTML = '⏳ Generating 4-Week Roadmap...';
    resultsArea.style.display = 'block';
    resultsArea.innerHTML = '<div class="skeleton" style="height: 300px;"></div>';

    try {
        const roadmap = await API.ai.generateRoadmap(topic, level, goal, hours);
        btn.disabled = false;
        btn.innerHTML = '🚀 Generate 4-Week Roadmap';

        renderRoadmap(roadmap);

    } catch (error) {
        btn.disabled = false;
        btn.innerHTML = '🚀 Generate 4-Week Roadmap';
        showToast('Failed to generate roadmap: ' + error.message, 'error');
        resultsArea.innerHTML = '<p style="color: var(--text-muted);">Failed to generate roadmap. Please try again.</p>';
    }
}

function renderRoadmap(roadmap) {
    const container = document.getElementById('roadmapResultsArea');
    if (!roadmap || !roadmap.weeks) return;

    let html = `
        <div style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--primary-color); margin-bottom: 0.25rem;">${escapeHtml(roadmap.title || 'Learning Roadmap')}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem;">${escapeHtml(roadmap.overview || '')}</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="copyRoadmapText()">📋 Copy Roadmap</button>
            </div>
            
            ${roadmap.prerequisites && roadmap.prerequisites.length > 0 ? `
                <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted);">
                    <strong>Prerequisites:</strong> ${roadmap.prerequisites.map(p => escapeHtml(p)).join(' · ')}
                </div>
            ` : ''}
        </div>

        <div class="roadmap-container">
    `;

    roadmap.weeks.forEach(w => {
        html += `
            <div class="roadmap-week-card">
                <div class="roadmap-week-header">
                    <div class="roadmap-week-num">${w.week}</div>
                    <div>
                        <div class="roadmap-week-title">${escapeHtml(w.theme || `Week ${w.week}`)}</div>
                        <div style="font-size: 0.825rem; color: var(--text-muted);">Milestone Focus</div>
                    </div>
                </div>

                <div style="margin-bottom: 0.75rem;">
                    <strong>Key Topics:</strong>
                    <div class="roadmap-badge-list">
                        ${(w.keyTopics || []).map(t => `<span class="roadmap-badge">${escapeHtml(t)}</span>`).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 0.75rem; font-size: 0.9rem;">
                    <strong>🛠️ Practical Task:</strong> ${escapeHtml(w.practicalTask || '')}
                </div>

                <div class="roadmap-tutor-tip">
                    <strong>🤝 Peer Tutoring Goal:</strong> ${escapeHtml(w.peerSessionAdvice || '')}
                </div>
            </div>
        `;
    });

    if (roadmap.capstoneProject) {
        html += `
            <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(6, 182, 212, 0.1)); border: 1px solid var(--primary-color); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: 1.5rem;">
                <h4 style="font-weight: 800; font-size: 1.1rem; color: var(--primary-color); margin-bottom: 0.5rem;">🏆 Capstone Portfolio Showcase:</h4>
                <p style="font-size: 0.95rem; line-height: 1.6;">${escapeHtml(roadmap.capstoneProject)}</p>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
    window.currentRoadmap = roadmap;
}

function copyRoadmapText() {
    if (!window.currentRoadmap) return;
    const r = window.currentRoadmap;
    let text = `${r.title}\n${r.overview}\n\n`;
    (r.weeks || []).forEach(w => {
        text += `[Week ${w.week}: ${w.theme}]\n`;
        text += `Topics: ${(w.keyTopics || []).join(', ')}\n`;
        text += `Practical Task: ${w.practicalTask}\n`;
        text += `Peer Session Goal: ${w.peerSessionAdvice}\n\n`;
    });
    if (r.capstoneProject) {
        text += `Capstone Showcase: ${r.capstoneProject}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('Roadmap copied to clipboard! 📋', 'success');
    }).catch(() => {
        showToast('Could not copy roadmap', 'error');
    });
}

// ─── 6. Diagnostic Quiz ─────────────────────────────────────────────
async function handleQuizSubmit(event) {
    event.preventDefault();
    const topic = document.getElementById('quizTopic').value.trim();
    const level = document.getElementById('quizLevel').value;
    const btn = document.getElementById('quizSubmitBtn');
    const resultsArea = document.getElementById('quizResultsArea');

    if (!topic) return;

    btn.disabled = true;
    btn.innerHTML = '⏳ Generating...';
    resultsArea.style.display = 'block';
    resultsArea.innerHTML = '<div class="skeleton" style="height: 250px;"></div>';

    try {
        const quiz = await API.ai.generateQuiz(topic, level);
        btn.disabled = false;
        btn.innerHTML = 'Generate Quiz 🎯';

        renderQuiz(quiz);

    } catch (error) {
        btn.disabled = false;
        btn.innerHTML = 'Generate Quiz 🎯';
        showToast('Failed to generate quiz: ' + error.message, 'error');
        resultsArea.innerHTML = '<p style="color: var(--text-muted);">Could not load quiz questions.</p>';
    }
}

function renderQuiz(quiz) {
    const container = document.getElementById('quizResultsArea');
    if (!quiz || !quiz.questions) return;

    let html = `
        <div style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.2rem; font-weight: 700;">Diagnostic Quiz: ${escapeHtml(quiz.topic)}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Answer the 3 questions below to check your readiness:</p>
        </div>
    `;

    quiz.questions.forEach((q, qIndex) => {
        html += `
            <div class="roadmap-week-card" style="margin-bottom: 1.5rem;" id="quiz-q-${qIndex}">
                <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem;">${qIndex + 1}. ${escapeHtml(q.question)}</h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${q.options.map((opt, optIndex) => `
                        <button class="btn btn-secondary" style="justify-content: flex-start; text-align: left; font-size: 0.9rem; padding: 0.75rem 1rem;" onclick="checkAnswer(${qIndex}, ${optIndex}, ${q.correctIndex}, '${escapeAttr(q.explanation || '')}')">
                            ${String.fromCharCode(65 + optIndex)}. ${escapeHtml(opt)}
                        </button>
                    `).join('')}
                </div>
                <div id="quiz-feedback-${qIndex}" style="display: none; margin-top: 1rem; padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.85rem;"></div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function checkAnswer(qIndex, selectedIndex, correctIndex, explanation) {
    const qCard = document.getElementById(`quiz-q-${qIndex}`);
    const feedback = document.getElementById(`quiz-feedback-${qIndex}`);
    const buttons = qCard.querySelectorAll('button');

    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correctIndex) {
            btn.style.background = 'rgba(16, 185, 129, 0.2)';
            btn.style.borderColor = '#10b981';
            btn.style.color = '#10b981';
        } else if (idx === selectedIndex && selectedIndex !== correctIndex) {
            btn.style.background = 'rgba(239, 68, 68, 0.2)';
            btn.style.borderColor = '#ef4444';
            btn.style.color = '#ef4444';
        }
    });

    feedback.style.display = 'block';
    if (selectedIndex === correctIndex) {
        feedback.style.background = 'rgba(16, 185, 129, 0.15)';
        feedback.style.color = 'var(--text-primary)';
        feedback.innerHTML = `✅ <strong>Correct!</strong> ${escapeHtml(explanation)}`;
    } else {
        feedback.style.background = 'rgba(239, 68, 68, 0.15)';
        feedback.style.color = 'var(--text-primary)';
        feedback.innerHTML = `❌ <strong>Not quite.</strong> ${escapeHtml(explanation)}`;
    }
}

// ─── Helpers ────────────────────────────────────────────────────────
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
