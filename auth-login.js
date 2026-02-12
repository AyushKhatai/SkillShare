// Login page functionality

// Check if already logged in
if (API && API.auth.isAuthenticated()) {
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
                const response = await API.auth.login({ email, password });

                // Store user data
                if (response.token) {
                    // Fetch user profile
                    const profileResponse = await API.users.getProfile();
                    API.setUser(profileResponse.user);

                    // Show success message
                    alert('Login successful! Redirecting to dashboard...');

                    // Redirect to dashboard
                    window.location.href = '/dashboard.html';
                }
            } catch (error) {
                alert(error.message || 'Login failed. Please check your credentials.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});
