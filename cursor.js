// ─── Custom Cursor ───────────────────────────────────────────
// Mirrors the React <CustomCursor /> + <CustomCursorTarget />
// API using vanilla JS + Web Animations + a CSS spring for
// pointer follow. Behaves like a tracked pointer with a hover
// affordance over interactive elements.
//
// Usage:
//   <div data-cursor>…</div>                  → triggers hover
//   <div data-cursor="lg">…</div>             → larger hover
//   Or auto: any .btn, a, button, [role=button]
//
// Skip the cursor by adding `data-cursor-disabled` to a container
// or by setting `prefers-reduced-motion: reduce`.

(function () {
    const DEFAULT_COLOR = '#ff4c24';
    const HOVER_SIZE = 48;
    const REST_SIZE = 16;
    const EASE = 'cubic-bezier(0.625, 0.05, 0, 1)';
    const DURATION = 0.375; // seconds

    // Bail out on touch / coarse pointers / reduced motion
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.SKILLSHARE_NO_CURSOR) return;

    // ── Build DOM ────────────────────────────────────────────
    const cursor = document.createElement('div');
    cursor.className = 'ss-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<div class="ss-cursor__ring"></div>';
    document.body.appendChild(cursor);

    const ring = cursor.firstElementChild;

    // Pull color from CSS var if present, else default
    function getColor() {
        const fromVar = getComputedStyle(document.documentElement)
            .getPropertyValue('--cursor-color')
            .trim();
        return fromVar || DEFAULT_COLOR;
    }

    // ── State ────────────────────────────────────────────────
    let isHovering = false;
    let rafId = null;
    let lastEvent = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const STIFFNESS = 0.18; // 0–1, higher = snappier

    // Track pointer (passive listener, no React-style hydration)
    function onPointerMove(e) {
        lastEvent = e;
        targetX = e.clientX;
        targetY = e.clientY;
        if (!cursor.classList.contains('ss-cursor--active')) {
            cursor.classList.add('ss-cursor--active');
        }
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', () => cursor.classList.add('ss-cursor--down'));
    window.addEventListener('pointerup',   () => cursor.classList.remove('ss-cursor--down'));
    window.addEventListener('mouseleave', () => cursor.classList.remove('ss-cursor--active'));
    window.addEventListener('mouseenter', () => cursor.classList.add('ss-cursor--active'));

    // Spring follow loop
    function tick() {
        currentX += (targetX - currentX) * STIFFNESS;
        currentY += (targetY - currentY) * STIFFNESS;
        cursor.style.transform =
            `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
        rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    // ── Hover targets ────────────────────────────────────────
    // Anything explicitly marked, plus common interactive elements
    const EXPLICIT_SELECTOR = '[data-cursor]';
    const AUTO_SELECTOR = 'a, button, .btn, [role="button"], .browse-chip, .skill-card, .bento__cell, .faq__item summary, .ticker__item';

    function isInteractive(el) {
        if (!el || el === document.body || el === document.documentElement) return false;
        if (el.closest('[data-cursor-disabled]')) return false;
        if (el.closest('input, textarea, select, [contenteditable="true"]')) return false;
        return el.matches(EXPLICIT_SELECTOR) || el.closest(AUTO_SELECTOR);
    }

    function onOver(e) {
        // Hide custom cursor when entering text-input surfaces
        if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) {
            cursor.classList.add('ss-cursor--hidden');
            return;
        }
        cursor.classList.remove('ss-cursor--hidden');
        const target = e.target.closest(EXPLICIT_SELECTOR + ', ' + AUTO_SELECTOR);
        if (target && isInteractive(target)) {
            setHover(target, true);
        }
    }
    function onOut(e) {
        const target = e.target.closest(EXPLICIT_SELECTOR + ', ' + AUTO_SELECTOR);
        if (target && isInteractive(target)) {
            setHover(target, false);
        }
    }

    function setHover(target, hovering) {
        if (hovering) {
            // Determine hover size from data attr (sm|md|lg) — default md
            const sizeAttr = target.closest('[data-cursor]')?.getAttribute('data-cursor') || 'md';
            const sizeMap = { sm: 32, md: 48, lg: 64 };
            const size = sizeMap[sizeAttr] || HOVER_SIZE;
            cursor.style.setProperty('--cursor-size', size + 'px');
            isHovering = true;
            cursor.classList.add('ss-cursor--hover');
            // Label: data-cursor-label on target
            const label = target.closest('[data-cursor]')?.getAttribute('data-cursor-label');
            updateLabel(label);
        } else {
            isHovering = false;
            cursor.classList.remove('ss-cursor--hover');
            updateLabel(null);
        }
    }

    function updateLabel(text) {
        if (text) {
            if (!cursor.querySelector('.ss-cursor__label')) {
                const el = document.createElement('span');
                el.className = 'ss-cursor__label';
                cursor.appendChild(el);
            }
            cursor.querySelector('.ss-cursor__label').textContent = text;
        } else {
            const el = cursor.querySelector('.ss-cursor__label');
            if (el) el.remove();
        }
    }

    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerout',  onOut,  { passive: true });

    // Hide the OS cursor over interactive surfaces
    const style = document.createElement('style');
    style.textContent = `
        @media (pointer: fine) {
            html:has(.ss-cursor) a,
            html:has(.ss-cursor) button,
            html:has(.ss-cursor) .btn,
            html:has(.ss-cursor) [role="button"],
            html:has(.ss-cursor) [data-cursor] { cursor: none; }
        }
    `;
    document.head.appendChild(style);

    // Recolor on theme change (in case color var changes)
    const observer = new MutationObserver(() => {
        cursor.style.color = getColor();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    cursor.style.color = getColor();
})();