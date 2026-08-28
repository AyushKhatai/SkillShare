// ─── Theme Toggle System (Zero-Flash) ─────────────────────

(function () {
    // Immediate synchronous theme application to prevent FOUC
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

const themeToggle = {
    init: () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
        themeToggle.updateIcon(currentTheme === 'dark');

        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.removeEventListener('click', themeToggle.toggle);
            toggleBtn.addEventListener('click', themeToggle.toggle);
        }
    },

    toggle: () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.updateIcon(newTheme === 'dark');
    },

    updateIcon: (isDark) => {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.innerHTML = isDark ? '☀️' : '🌙';
            toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', themeToggle.init);
} else {
    themeToggle.init();
}
