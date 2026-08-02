/* Theme System */
class ThemeManager {
    constructor() {
        this.themeToggleBtn = document.getElementById('themeToggleBtn');
        this.themeIcon = document.getElementById('themeIcon');
        this.init();
    }

    init() {
        const savedTheme = StorageManager.get('theme', 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateIcon(savedTheme);
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        StorageManager.set('theme', newTheme);
        this.updateIcon(newTheme);
    }

    updateIcon(theme) {
        if (!this.themeIcon) return;
        if (theme === 'dark') {
            this.themeIcon.className = 'fa-solid fa-moon';
        } else {
            this.themeIcon.className = 'fa-solid fa-sun';
        }
    }
}

window.ThemeManager = ThemeManager;
