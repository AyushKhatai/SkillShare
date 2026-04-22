// Login page functionality

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
}

// Login form handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = e.target.querySelector('button[type="submit"]');

            // Disable button and show loading state
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    // Store token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Show success toast
                    showToast('Login successful! Redirecting...', 'success');

                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 800);
                } else if (data.needsPasswordLink) {
                    // User needs to link password — show inline option
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    showPasswordLinkUI(email, data.message);
                } else {
                    showToast(data.message || 'Login failed. Please check your credentials.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } catch (error) {
                console.error('Login error:', error);
                showToast('Login failed. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

// Show in-page password link UI (replaces confirm + prompt)
function showPasswordLinkUI(email, message) {
    // Remove existing if any
    let existing = document.getElementById('passwordLinkSection');
    if (existing) existing.remove();

    const formCard = document.querySelector('.auth-form') || document.querySelector('form');
    if (!formCard) return;

    const section = document.createElement('div');
    section.id = 'passwordLinkSection';
    section.style.cssText = 'margin-top: 1.5rem; padding: 1.25rem; background: var(--primary-light); border-radius: 0.75rem; border: 1px solid var(--border-color); animation: fadeInUp 0.3s ease;';
    section.innerHTML = `
        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.5;">
            ${message || 'This account uses Google login.'}
        </p>
        <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.75rem; font-size: 0.9375rem;">
            Set a password for email login:
        </p>
        <div class="form-group" style="margin-bottom: 0.75rem;">
            <input type="password" id="linkNewPassword" class="form-input" placeholder="Enter new password (min 6 characters)" minlength="6">
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="btn btn-primary btn-sm" id="linkPasswordBtn" style="flex:1;">Set Password</button>
            <button type="button" class="btn btn-secondary btn-sm" id="cancelLinkBtn">Cancel</button>
        </div>
    `;

    formCard.parentNode.insertBefore(section, formCard.nextSibling);

    document.getElementById('linkNewPassword').focus();

    document.getElementById('cancelLinkBtn').addEventListener('click', () => {
        section.remove();
    });

    document.getElementById('linkPasswordBtn').addEventListener('click', async () => {
        const newPassword = document.getElementById('linkNewPassword').value;
        if (!newPassword || newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'warning');
            return;
        }
        await linkPasswordToAccount(email, newPassword);
    });
}

// Helper function to link password to Google account
async function linkPasswordToAccount(email, password) {
    try {
        const response = await fetch('/api/auth/link-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showToast('Password set successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 800);
        } else {
            showToast(data.message || 'Failed to set password. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Link password error:', error);
        showToast('Failed to set password. Please try again.', 'error');
    }
}
