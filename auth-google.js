// Google Authentication Handler

(function () {
    const DEFAULT_GOOGLE_CLIENT_ID = "430047701131-jkgfdh2hlshv21v222kkunjtu9hmjdok.apps.googleusercontent.com";

    // Function to load Google Identity Services script
    function loadGoogleScript(clientId) {
        const idToUse = clientId || DEFAULT_GOOGLE_CLIENT_ID;

        // If script is already present
        if (window.google && window.google.accounts) {
            initGoogleBtn(idToUse);
            return;
        }

        const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => initGoogleBtn(idToUse));
            return;
        }

        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => initGoogleBtn(idToUse);
        script.onerror = () => {
            console.error("Failed to load Google Identity Services SDK");
            const btnContainer = document.getElementById("google-btn-container");
            if (btnContainer) {
                btnContainer.innerHTML = "<p style='color:var(--text-secondary);font-size:0.85rem;text-align:center;'>Google Sign-In unavailable (Network offline)</p>";
            }
        };
        document.head.appendChild(script);
    }

    // Initialize Google Button
    function initGoogleBtn(clientId) {
        if (!window.google || !window.google.accounts) {
            console.warn("Google Identity Services not yet ready");
            return;
        }

        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: false
            });

            const btnContainer = document.getElementById("google-btn-container");
            if (btnContainer) {
                btnContainer.innerHTML = '';
                google.accounts.id.renderButton(
                    btnContainer,
                    { theme: "outline", size: "large", width: 350, text: "continue_with", shape: "rectangular" }
                );
            }
        } catch (err) {
            console.error("Failed to initialize Google button:", err);
        }
    }

    // Handle the JWT response from Google
    async function handleCredentialResponse(response) {
        try {
            console.log("Google JWT received");

            if (!response.credential) {
                throw new Error("No credential received from Google");
            }

            const baseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : '/api';

            // Send to backend verification
            const res = await fetch(`${baseUrl}/auth/google`, {
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
                if (typeof showToast === 'function') {
                    showToast('Login successful! Redirecting...', 'success');
                }
                setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
            } else {
                throw new Error(data.message || 'Google Auth Failed');
            }

        } catch (error) {
            console.error('Error during Google Auth:', error);
            if (typeof showToast === 'function') {
                showToast('Authentication failed: ' + error.message, 'error');
            }
        }
    }

    // Initializer
    async function init() {
        // 1. Immediately load Google Script with default client ID to ensure button renders with 0 delay
        loadGoogleScript(DEFAULT_GOOGLE_CLIENT_ID);

        // 2. Fetch Client ID from backend config in background if available
        try {
            const baseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : '/api';
            const res = await fetch(`${baseUrl}/config`);
            if (res.ok) {
                const config = await res.json();
                if (config.googleClientId && config.googleClientId !== DEFAULT_GOOGLE_CLIENT_ID) {
                    initGoogleBtn(config.googleClientId);
                }
            }
        } catch (e) {
            // Pre-configured default is already initialized
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
