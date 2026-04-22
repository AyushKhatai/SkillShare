// Messages Page Logic

// Auth check
if (!API.auth.isAuthenticated()) {
    window.location.href = 'login.html';
}

const currentUser = API.getUser();

// Setup user display
if (currentUser) {
    const displayName = currentUser.name || currentUser.full_name || 'User';
    document.getElementById('userNameDisplay').textContent = displayName;
    const avatarEl = document.getElementById('userAvatarDisplay');
    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
}

// State
let conversations = [];
let activeConversationId = null;
let activeReceiverId = null;
let pollTimer = null;

// DOM elements
const conversationsListEl = document.getElementById('conversationsList');
const chatEmpty = document.getElementById('chatEmpty');
const chatHeader = document.getElementById('chatHeader');
const chatMessages = document.getElementById('chatMessages');
const chatInputArea = document.getElementById('chatInputArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messageForm = document.getElementById('messageForm');
const searchInput = document.getElementById('searchConversations');
const backBtn = document.getElementById('backToConversations');

// ─── Init ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadConversations();
    setupMessageForm();
    setupSearch();
    setupMobileBack();
    setupAutoResize();

    // Check URL params for auto-opening a conversation
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('conversation');
    const receiverId = params.get('receiver');
    const receiverName = params.get('name');
    const skillTitle = params.get('skill');

    if (convId && receiverId) {
        // Delay to let conversations load
        setTimeout(() => {
            openConversation(convId, parseInt(receiverId), receiverName || 'User', skillTitle || '');
        }, 500);
    }

    // Poll for new messages every 5 seconds
    pollTimer = setInterval(() => {
        if (activeConversationId) {
            loadMessagesQuiet(activeConversationId);
        }
        loadUnreadCount();
    }, 5000);
});

// Cleanup on page leave
window.addEventListener('beforeunload', () => {
    if (pollTimer) clearInterval(pollTimer);
});

// ─── Load Conversations ────────────────
async function loadConversations() {
    try {
        const res = await API.messages.getConversations();
        conversations = res.conversations || [];
        renderConversations(conversations);
        loadUnreadCount();
    } catch (error) {
        console.error('Failed to load conversations:', error);
        conversationsListEl.innerHTML = `
            <div class="msg-no-conversations">
                <div class="msg-empty-icon">💬</div>
                <p>No conversations yet</p>
                <p class="msg-empty-sub">Start a conversation from the Sessions or Skills page</p>
            </div>
        `;
    }
}

// ─── Render Conversations ──────────────
function renderConversations(convos) {
    if (convos.length === 0) {
        conversationsListEl.innerHTML = `
            <div class="msg-no-conversations">
                <div class="msg-empty-icon">💬</div>
                <p>No conversations yet</p>
                <p class="msg-empty-sub">Start a conversation from the Sessions or Skills page</p>
            </div>
        `;
        return;
    }

    conversationsListEl.innerHTML = convos.map(c => {
        const otherName = getOtherUserName(c);
        const initial = otherName.charAt(0).toUpperCase();
        const preview = c.last_message ? truncate(c.last_message, 45) : 'No messages yet';
        const timeStr = c.last_message_at ? formatRelativeTime(c.last_message_at) : '';
        const unread = parseInt(c.unread_count) || 0;
        const isActive = c.conversation_id === activeConversationId;
        const otherId = getOtherUserId(c);

        return `
            <div class="msg-convo-item ${unread > 0 ? 'unread' : ''} ${isActive ? 'active' : ''}"
                 onclick="openConversation('${escapeAttr(c.conversation_id)}', ${otherId}, '${escapeAttr(otherName)}', '${escapeAttr(c.skill_title || '')}')"
                 data-conversation-id="${escapeAttr(c.conversation_id)}">
                <div class="msg-convo-avatar">${initial}</div>
                <div class="msg-convo-info">
                    ${c.skill_title ? `<span class="msg-convo-skill-tag">${escapeHtml(truncate(c.skill_title, 25))}</span>` : ''}
                    <div class="msg-convo-top">
                        <span class="msg-convo-name">${escapeHtml(otherName)}</span>
                        <span class="msg-convo-time">${timeStr}</span>
                    </div>
                    <div class="msg-convo-bottom">
                        <span class="msg-convo-preview">${escapeHtml(preview)}</span>
                        ${unread > 0 ? '<div class="msg-convo-unread-dot"></div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ─── Open Conversation ─────────────────
async function openConversation(conversationId, receiverId, receiverName, skillTitle) {
    activeConversationId = conversationId;
    activeReceiverId = receiverId;

    // Update UI
    chatEmpty.style.display = 'none';
    chatHeader.style.display = 'flex';
    chatMessages.style.display = 'flex';
    chatInputArea.style.display = 'block';

    // Set header
    document.getElementById('chatAvatar').textContent = (receiverName || 'U').charAt(0).toUpperCase();
    document.getElementById('chatUserName').textContent = receiverName || 'User';
    document.getElementById('chatSkillLabel').textContent = skillTitle || '';

    // Highlight active conversation
    document.querySelectorAll('.msg-convo-item').forEach(el => {
        el.classList.toggle('active', el.dataset.conversationId === conversationId);
    });

    // Mobile: hide conversations panel
    const convPanel = document.getElementById('conversationsPanel');
    if (window.innerWidth <= 768) {
        convPanel.classList.add('hidden-mobile');
    }

    // Load messages
    await loadMessages(conversationId);

    // Focus input
    messageInput.focus();
}

// ─── Load Messages ─────────────────────
async function loadMessages(conversationId) {
    chatMessages.innerHTML = `
        <div class="msg-loading">
            <div class="msg-loading-spinner"></div>
            <p>Loading messages...</p>
        </div>
    `;

    try {
        const res = await API.messages.getMessages(conversationId);
        const messages = res.messages || [];
        renderMessages(messages);
        scrollToBottom();

        // Also refresh conversation list to update unread
        loadConversations();
    } catch (error) {
        console.error('Failed to load messages:', error);
        chatMessages.innerHTML = `
            <div class="msg-loading">
                <p>Failed to load messages</p>
            </div>
        `;
    }
}

// Quiet reload (no loading spinner) for polling
async function loadMessagesQuiet(conversationId) {
    try {
        const res = await API.messages.getMessages(conversationId);
        const messages = res.messages || [];
        const currentCount = chatMessages.querySelectorAll('.msg-bubble-wrapper').length;

        if (messages.length !== currentCount) {
            renderMessages(messages);
            scrollToBottom();
            loadConversations();
        }
    } catch (error) {
        // Silently fail for polling
    }
}

// ─── Render Messages ───────────────────
function renderMessages(messages) {
    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="msg-loading">
                <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">👋</p>
                <p>Start the conversation! Say hello.</p>
            </div>
        `;
        return;
    }

    let html = '';
    let lastDate = '';

    messages.forEach(msg => {
        const msgDate = new Date(msg.created_at).toLocaleDateString();
        if (msgDate !== lastDate) {
            html += `<div class="msg-date-divider">${formatMessageDate(msg.created_at)}</div>`;
            lastDate = msgDate;
        }

        const isSent = msg.sender_id === (currentUser.id || currentUser.user_id);
        const timeStr = formatMessageTime(msg.created_at);

        html += `
            <div class="msg-bubble-wrapper ${isSent ? 'sent' : 'received'}">
                <div class="msg-bubble">${escapeHtml(msg.content)}</div>
                <span class="msg-bubble-time">${timeStr}</span>
            </div>
        `;
    });

    chatMessages.innerHTML = html;
}

// ─── Send Message ──────────────────────
function setupMessageForm() {
    // Enable/disable send button based on input
    messageInput.addEventListener('input', () => {
        sendBtn.disabled = !messageInput.value.trim();
    });

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = messageInput.value.trim();
        if (!content || !activeReceiverId) return;

        // Immediately show the message (optimistic)
        appendOptimisticMessage(content);
        messageInput.value = '';
        sendBtn.disabled = true;
        scrollToBottom();

        try {
            // Extract bookingId from conversation ID if present
            let bookingId = null;
            if (activeConversationId && activeConversationId.includes('_b')) {
                const parts = activeConversationId.split('_b');
                bookingId = parseInt(parts[parts.length - 1]);
            }

            await API.messages.sendMessage(activeReceiverId, content, bookingId);

            // Refresh messages to get server timestamp
            await loadMessagesQuiet(activeConversationId);
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove optimistic message on failure
            const lastBubble = chatMessages.querySelector('.msg-bubble-wrapper.optimistic');
            if (lastBubble) lastBubble.remove();
            messageInput.value = content;
            sendBtn.disabled = false;
        }
    });

    // Send on Enter (Shift+Enter for newline)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            messageForm.dispatchEvent(new Event('submit'));
        }
    });
}

function appendOptimisticMessage(content) {
    const timeStr = formatMessageTime(new Date().toISOString());
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble-wrapper sent optimistic';
    bubble.innerHTML = `
        <div class="msg-bubble">${escapeHtml(content)}</div>
        <span class="msg-bubble-time">${timeStr}</span>
    `;
    // Remove empty state if exists
    const loading = chatMessages.querySelector('.msg-loading');
    if (loading) loading.remove();

    chatMessages.appendChild(bubble);
}

// ─── Auto-resize textarea ──────────────
function setupAutoResize() {
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    });
}

// ─── Search ────────────────────────────
function setupSearch() {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            renderConversations(conversations);
            return;
        }
        const filtered = conversations.filter(c => {
            const name = getOtherUserName(c).toLowerCase();
            const skill = (c.skill_title || '').toLowerCase();
            return name.includes(query) || skill.includes(query);
        });
        renderConversations(filtered);
    });
}

// ─── Mobile Back ───────────────────────
function setupMobileBack() {
    backBtn.addEventListener('click', () => {
        const convPanel = document.getElementById('conversationsPanel');
        convPanel.classList.remove('hidden-mobile');
        activeConversationId = null;
        activeReceiverId = null;

        // Deselect
        document.querySelectorAll('.msg-convo-item').forEach(el => el.classList.remove('active'));

        // Reset chat area
        chatEmpty.style.display = 'flex';
        chatHeader.style.display = 'none';
        chatMessages.style.display = 'none';
        chatInputArea.style.display = 'none';
    });
}

// ─── Unread Count ──────────────────────
async function loadUnreadCount() {
    try {
        const res = await API.messages.getUnreadCount();
        const count = res.count || 0;

        const badge = document.getElementById('totalUnreadBadge');
        const sidebarBadge = document.getElementById('sidebarUnreadBadge');

        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
        if (sidebarBadge) {
            sidebarBadge.textContent = count;
            sidebarBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    } catch (e) {
        // Silently fail
    }
}

// ─── Helpers ───────────────────────────
function getOtherUserName(conversation) {
    const userId = currentUser.id || currentUser.user_id;
    if (conversation.user1_id === userId) {
        return conversation.user2_name || 'User';
    }
    return conversation.user1_name || 'User';
}

function getOtherUserId(conversation) {
    const userId = currentUser.id || currentUser.user_id;
    if (conversation.user1_id === userId) {
        return conversation.user2_id;
    }
    return conversation.user1_id;
}

function scrollToBottom() {
    if (chatMessages) {
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

function formatRelativeTime(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatMessageTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatMessageDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Expose for external use (dashboard "Message" button)
window.openChat = openConversation;
