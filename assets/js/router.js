/* Router System */
class Router {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.sections = document.querySelectorAll('.view-section');
        this.pageTitle = document.getElementById('pageTitle');
        this.init();
    }
     
    init() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = item.getAttribute('data-target');
                if (target) {
                    e.preventDefault();
                    this.navigateTo(target);
                }
            });
        });
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1) || 'dashboard';
            this.showSection(hash);
        });
        const initialHash = window.location.hash.substring(1) || 'dashboard';
        this.showSection(initialHash);
    }
     
    navigateTo(target) {
        window.location.hash = target;
        this.showSection(target);
        const sidebar = document.getElementById('appSidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
    }
     
    showSection(target) {
        this.sections.forEach(sec => sec.classList.remove('active'));
        this.navItems.forEach(item => item.classList.remove('active'));
        const activeSection = document.getElementById(`view-${target}`);
        const activeNav = document.querySelector(`.nav-item[data-target="${target}"]`);
        if (activeSection) activeSection.classList.add('active');
        if (activeNav) activeNav.classList.add('active');
        if (this.pageTitle && activeNav) {
            const spanText = activeNav.querySelector('span');
            if (spanText) this.pageTitle.textContent = spanText.textContent;
        }
    }
}

// Ensure global router instance is available immediately for onclick handlers
window.Router = Router;
