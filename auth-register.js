// Registration page functionality

// Check if already logged in
if (API && API.auth.isAuthenticated()) {
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
                alert('Passwords do not match!');
                return;
            }

            // Validate password length
            if (password.length < 6) {
                alert('Password must be at least 6 characters long!');
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

                const response = await API.auth.register(userData);

                // Show success message
                alert('Account created successfully! Please login.');

                // Redirect to login page
                window.location.href = '/login.html';
            } catch (error) {
                alert(error.message || 'Registration failed. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});
