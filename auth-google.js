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
        if (!window.google) {
            console.error("Google Identity Services not loaded");
            return;
        }

        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: false
        });

        const btnContainer = document.getElementById("google-btn-container");
        if (btnContainer) {
            google.accounts.id.renderButton(
                btnContainer,
                { theme: "outline", size: "large", width: 350 }
            );
        }
    }

    // Handle the JWT response from Google
    async function handleCredentialResponse(response) {
        try {
            console.log("Google JWT received");

            if (!response.credential) {
                throw new Error("No credential received from Google");
            }

            // Send to backend verification
            const res = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: response.credential })
            });

            const data = await res.json();

            if (res.ok) {
                // Store token
                localStorage.setItem('token', data.token);
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                console.log("Google login successful");
                showToast('Login successful! Redirecting...', 'success');
                setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
            } else {
                throw new Error(data.message || 'Google Auth Failed');
            }

        } catch (error) {
            console.error('Error during Google Auth:', error);
            showToast('Authentication failed: ' + error.message, 'error');
        }
    }

    // Initializer
    async function init() {
        try {
            // Fetch Client ID from backend config
            const res = await fetch(`${API_BASE_URL}/config`);
            if (res.ok) {
                const config = await res.json();
                if (config.googleClientId) {
                    console.log("Google Client ID loaded:", config.googleClientId.substring(0, 20) + "...");
                    loadGoogleScript(config.googleClientId);
                } else {
                    console.warn("Google Client ID not configured.");
                    const container = document.getElementById("google-btn-container");
                    if (container) {
                        container.innerHTML = "<p style='color:red;font-size:0.8rem;'>Google Client ID not configured. Please contact administrator.</p>";
                    }
                }
            } else {
                console.error("Failed to fetch config");
            }
        } catch (e) {
            console.error("Failed to load config:", e);
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
