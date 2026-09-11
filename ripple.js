// ================================================================
// RIPPLE BUTTON (Smooth expanding & contracting cursor-tracking ripple)
// Recreates the Framer Motion RippleButton in vanilla JS
// ================================================================

(function () {
    function initRippleButton(button) {
        if (!button || button._rippleInitialized) return;
        button._rippleInitialized = true;
        button.classList.add('ripple-button');

        function ensureContent() {
            let content = button.querySelector('.ripple-button__content');
            if (!content) {
                content = document.createElement('span');
                content.className = 'ripple-button__content';
                while (button.firstChild) {
                    content.appendChild(button.firstChild);
                }
                button.appendChild(content);
            }
            return content;
        }

        ensureContent();

        let ripple = null;
        let isHovered = false;

        function createRipple(e) {
            if (isHovered) return;
            isHovered = true;
            button.classList.add('is-hovered');

            if (ripple) {
                ripple.remove();
                ripple = null;
            }

            ensureContent();

            const rect = button.getBoundingClientRect();
            // Size diameter big enough to cover from any corner
            const size = Math.max(rect.width, rect.height) * 2.5;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            ripple = document.createElement('span');
            ripple.className = 'ripple-button__span';
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            button.appendChild(ripple);

            // Force layout reflow so initial scale(0) registers
            void ripple.offsetWidth;

            ripple.classList.add('is-expanding');
        }

        function handleMouseMove(e) {
            if (!isHovered || !ripple) return;
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
        }

        function removeRipple(e) {
            if (!isHovered) return;
            isHovered = false;
            button.classList.remove('is-hovered');

            if (!ripple) return;

            const currentRipple = ripple;
            ripple = null;

            if (e) {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                currentRipple.style.left = `${x}px`;
                currentRipple.style.top = `${y}px`;
            }

            currentRipple.classList.remove('is-expanding');
            currentRipple.classList.add('is-leaving');

            const cleanup = () => {
                currentRipple.remove();
                currentRipple.removeEventListener('transitionend', cleanup);
            };
            currentRipple.addEventListener('transitionend', cleanup);
            setTimeout(cleanup, 650);
        }

        button.addEventListener('mouseenter', createRipple);
        button.addEventListener('mousemove', handleMouseMove);
        button.addEventListener('mouseleave', removeRipple);

        // Keep content wrapped if script updates textContent later
        const observer = new MutationObserver(() => {
            const hasRawText = Array.from(button.childNodes).some(
                node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
            );
            if (hasRawText || !button.querySelector('.ripple-button__content')) {
                ensureContent();
            }
        });
        observer.observe(button, { childList: true });
    }

    function initAllRipples() {
        const selectors = [
            '.nav__link--ai',
            '.nav-ai-highlight',
            '#navAuthDashboard',
            '#navAuthProfile',
            '.nav__auth--solid',
            '[data-ripple]'
        ];
        document.querySelectorAll(selectors.join(',')).forEach(initRippleButton);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllRipples);
    } else {
        initAllRipples();
    }

    // Expose globally so dynamic elements can be initialized
    window.initRippleButton = initRippleButton;
    window.initAllRipples = initAllRipples;
})();
