
// Google Authentication Handler

(function () {
    // Function to load Google Identity Services script
    function loadGoogleScript(clientId) {
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => initGoogleBtn(clientId);
        document.head.appendChild(script);
    }

    // Initialize Google Button
    function initGoogleBtn(clientId) {
        if (!window.google) return;

        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse
        });

        const btnContainer = document.getElementById("google-btn-container");
        if (btnContainer) {
            google.accounts.id.renderButton(
                btnContainer,
                { theme: "outline", size: "large", width: "100%" }
            );
        }
    }

    // Handle the JWT response from Google
    async function handleCredentialResponse(response) {
        try {
            console.log("Google JWT:", response.credential);

            // Send to backend verification
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: response.credential })
            });

            const data = await res.json();

            if (res.ok) {
                // Store token similar to regular login
                localStorage.setItem('token', data.token);
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                alert('Login successful! Redirecting...');
                window.location.href = '/dashboard.html';
            } else {
                throw new Error(data.message || 'Google Auth Failed');
            }

        } catch (error) {
            console.error('Error during Google Auth:', error);
            alert('Authentication failed: ' + error.message);
        }
    }

    // Initializer
    async function init() {
        try {
            // Fetch Client ID from backend config
            const res = await fetch('/api/config');
            if (res.ok) {
                const config = await res.json();
                if (config.googleClientId) {
                    loadGoogleScript(config.googleClientId);
                } else {
                    console.warn("Google Client ID not configured.");
                    const container = document.getElementById("google-btn-container");
                    if (container) container.innerHTML = "<p style='color:red;font-size:0.8rem;'>Google Client ID missing in .env</p>";
                }
            }
        } catch (e) {
            console.error("Failed to load config:", e);
        }
    }

    // Run when DOM is ready
    document.addEventListener('DOMContentLoaded', init);

})();
