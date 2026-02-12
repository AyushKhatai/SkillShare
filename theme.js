
const themeToggle = {
    init: () => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.updateIcon(true);
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.updateIcon(false);
        }

        // Add event listener to toggle button if it exists
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
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

// Run on load
document.addEventListener('DOMContentLoaded', themeToggle.init);
