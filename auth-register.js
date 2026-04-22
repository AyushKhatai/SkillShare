// Registration page functionality

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
}

// Registration form handler
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const department = document.getElementById('department').value;
            const year = document.getElementById('year').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const submitBtn = e.target.querySelector('button[type="submit"]');

            // Validate passwords match
            if (password !== confirmPassword) {
                showToast('Passwords do not match!', 'error');
                return;
            }

            // Validate password length
            if (password.length < 6) {
                showToast('Password must be at least 6 characters long!', 'warning');
                return;
            }

            // Disable button and show loading state
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';

            try {
                const yearSuffix = year === '1' ? 'st' : year === '2' ? 'nd' : year === '3' ? 'rd' : 'th';

                const userData = {
                    full_name: `${firstName} ${lastName}`,
                    email,
                    password,
                    department,
                    year_of_study: `${year}${yearSuffix} Year`,
                    phone: phone || null
                };

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    // Store token and user data for auto-login
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Show success toast
                    showToast('Account created successfully! Redirecting...', 'success');

                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 800);
                } else {
                    showToast(data.message || 'Registration failed. Please try again.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } catch (error) {
                console.error('Registration error:', error);
                showToast('Registration failed. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});
