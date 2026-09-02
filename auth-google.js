// Google Authentication Handler

(function () {
    const DEFAULT_GOOGLE_CLIENT_ID = "430047701131-jkgfdh2hlshv21v222kkunjtu9hmjdok.apps.googleusercontent.com";
    let isInitialized = false;

    // Check if running directly via file://
    function checkEnvironment() {
        if (window.location.protocol === 'file:') {
            console.warn("Google Sign-In does not work from file:// protocol. Please open via http://localhost:3001");
            const btnContainer = document.getElementById("google-btn-container");
            if (btnContainer) {
                btnContainer.innerHTML = `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.75rem; border-radius: 0.5rem; text-align: center; font-size: 0.85rem; color: #ef4444;">
                        ⚠️ Google Sign-In requires a web server.<br>
                        Please access via <a href="http://localhost:3001/login.html" style="color: inherit; text-decoration: underline; font-weight: 600;">http://localhost:3001</a>
                    </div>
                `;
            }
            return false;
        }
        return true;
    }

    // Function to load Google Identity Services script
    function loadGoogleScript(clientId) {
        if (!checkEnvironment()) return;

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
                cancel_on_tap_outside: true,
                ux_mode: "popup",
                context: "signin"
            });

            const btnContainer = document.getElementById("google-btn-container");
            if (btnContainer) {
                btnContainer.innerHTML = '';
                google.accounts.id.renderButton(
                    btnContainer,
                    {
                        theme: "outline",
                        size: "large",
                        width: 350,
                        text: "continue_with",
                        shape: "rectangular"
                    }
                );
            }
            isInitialized = true;
        } catch (err) {
            console.error("Failed to initialize Google button:", err);
        }
    }

    // Handle the JWT response from Google
    async function handleCredentialResponse(response) {
        try {
            console.log("Google JWT received, sending to backend...");

            if (!response.credential) {
                throw new Error("No credential token received from Google");
            }

            if (typeof showToast === 'function') {
                showToast('Verifying Google account...', 'info');
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

            let data;
            try {
                data = await res.json();
            } catch (jsonErr) {
                throw new Error(`Server returned invalid response (Status ${res.status}). Make sure the backend server is running.`);
            }

            if (res.ok && data.token) {
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
        if (!checkEnvironment()) return;

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
