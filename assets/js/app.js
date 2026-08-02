/**
 * Main App Orchestrator with ES6 Modules, Focus Trapping, Keyboard Navigation & PWA Push Notifications
 */
import StorageManager from './storage.js';

class LifeFlowApp {
    constructor() {
        this.init();
        this.registerServiceWorker();
    }
    
    init() {
        window.storage = StorageManager;
        window.themeManager = typeof ThemeManager !== 'undefined' ? new ThemeManager() : null;
        window.componentManager = typeof ComponentManager !== 'undefined' ? new ComponentManager() : null;
        window.router = typeof Router !== 'undefined' ? new Router() : null;
        
        // Initialize Modules safely
        window.dashboardModule = typeof DashboardModule !== 'undefined' ? new DashboardModule() : null;
        window.plannerModule = typeof PlannerModule !== 'undefined' ? new PlannerModule() : null;
        window.pomodoroModule = typeof PomodoroModule !== 'undefined' ? new PomodoroModule() : null;
        window.calendarModule = typeof CalendarModule !== 'undefined' ? new CalendarModule() : null;
        window.goalsModule = typeof GoalsModule !== 'undefined' ? new GoalsModule() : null;
        window.habitsModule = typeof HabitsModule !== 'undefined' ? new HabitsModule() : null;
        window.analyticsModule = typeof AnalyticsModule !== 'undefined' ? new AnalyticsModule() : null;
        window.settingsModule = typeof SettingsModule !== 'undefined' ? new SettingsModule() : null;
        window.aiHubModule = typeof AIHubModule !== 'undefined' ? new AIHubModule() : null;

        // Central Store Sync for User Profile Name
        if (window.storage) {
            const savedSettings = window.storage.get('portfolio_settings', {});
            if (savedSettings.developerName) {
                const userNameEl = document.querySelector('.user-profile-card .user-name');
                if (userNameEl) userNameEl.textContent = savedSettings.developerName;
            }
        }

        // Event-driven state listener
        window.addEventListener('lifeflowStateChange', (e) => {
            const { key, value } = e.detail;
            if (key === 'portfolio_settings' && value && value.developerName) {
                const userNameEl = document.querySelector('.user-profile-card .user-name');
                if (userNameEl) userNameEl.textContent = value.developerName;
            }
        });

        window.addEventListener('portfolioProfileUpdated', (e) => {
            const details = e.detail;
            if (details && details.developerName) {
                const userNameEl = document.querySelector('.user-profile-card .user-name');
                if (userNameEl) userNameEl.textContent = details.developerName;
            }
        });

        // Advanced Keyboard Navigation & Focus Trapping
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.toggleCommandPalette(true);
            }
            if (e.key === 'Escape') {
                this.toggleCommandPalette(false);
                this.closeAllModals();
            }
            if (e.key === 'Tab') {
                this.handleFocusTrap(e);
            }
        });

        const searchWrapper = document.getElementById('openCommandPaletteSearch');
        if (searchWrapper) {
            searchWrapper.addEventListener('click', () => this.toggleCommandPalette(true));
        }

        const closePaletteBtn = document.getElementById('closeCommandPalette');
        const paletteModal = document.getElementById('commandPaletteModal');
        if (closePaletteBtn && paletteModal) {
            closePaletteBtn.addEventListener('click', () => this.toggleCommandPalette(false));
            paletteModal.addEventListener('click', (e) => {
                if (e.target === paletteModal) this.toggleCommandPalette(false);
            });
        }

        const paletteInput = document.getElementById('commandPaletteInput');
        if (paletteInput) {
            paletteInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase();
                const items = document.querySelectorAll('.command-item');
                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(val) ? 'flex' : 'none';
                });
            });
        }

        document.querySelectorAll('.command-item').forEach(item => {
            item.addEventListener('click', () => {
                const target = item.getAttribute('data-target');
                if (target && window.router) {
                    window.router.navigateTo(target);
                    this.toggleCommandPalette(false);
                }
            });
        });

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('appSidebar');
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('mobile-open');
                const isOpen = sidebar.classList.contains('mobile-open');
                mobileMenuBtn.setAttribute('aria-expanded', isOpen);
            });
        }

        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.remove('mobile-open');
                if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        }

        document.addEventListener('click', (e) => {
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                const clickedInsideSidebar = sidebar.contains(e.target);
                const clickedMenuBtn = mobileMenuBtn && mobileMenuBtn.contains(e.target);
                if (!clickedInsideSidebar && !clickedMenuBtn) {
                    sidebar.classList.remove('mobile-open');
                    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });

        const notificationBtn = document.getElementById('notificationBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');
        const notificationBadge = document.getElementById('notificationBadge');
        const notificationCountBadge = document.getElementById('notificationCountBadge');
        const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
        const notificationList = document.getElementById('notificationList');

        // Load real stored notifications instead of the old static/fake
        // hardcoded examples in index.html.
        if (typeof ComponentManager !== 'undefined' && notificationList) {
            ComponentManager.renderNotificationList();
        }

        if (notificationBtn && notificationDropdown) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = notificationDropdown.style.display === 'block';
                notificationDropdown.style.display = isVisible ? 'none' : 'block';
                notificationBtn.setAttribute('aria-expanded', !isVisible);

                // Request push permissions on opening notifications dropdown if not granted yet
                this.requestNotificationPermission();

                if (!isVisible) {
                    if (notificationBadge) notificationBadge.style.display = 'none';
                    if (notificationCountBadge) notificationCountBadge.textContent = '0 New';
                }
            });

            if (clearNotificationsBtn && notificationList) {
                clearNotificationsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof ComponentManager !== 'undefined') {
                        ComponentManager.clearNotifications();
                    }
                    if (notificationBadge) notificationBadge.style.display = 'none';
                    if (notificationCountBadge) notificationCountBadge.textContent = '0 New';
                });
            }

            document.addEventListener('click', (e) => {
                if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
                    notificationDropdown.style.display = 'none';
                    notificationBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        console.log('LifeFlow AI - Professional ES6 Module Architecture Initialized Successfully.');
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('ServiceWorker registration successful:', reg.scope))
                    .catch(err => console.log('ServiceWorker registration failed:', err));
            });
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                    this.subscribeUserToPush();
                } else {
                    console.warn('Notification permission denied.');
                }
            }
        }
    }

    async subscribeUserToPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            console.log('Service Worker is ready for Push Notifications');
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        }
    }

    static triggerLocalNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body: body,
                    icon: 'assets/icons/icon-192.png',
                    vibrate: [200, 100, 200]
                });
            });
        }
    }

    toggleCommandPalette(show) {
        const paletteModal = document.getElementById('commandPaletteModal');
        const paletteInput = document.getElementById('commandPaletteInput');
        if (!paletteModal) return;

        if (show) {
            paletteModal.style.display = 'flex';
            paletteModal.setAttribute('aria-hidden', 'false');
            if (paletteInput) {
                paletteInput.value = '';
                paletteInput.focus();
            }
        } else {
            paletteModal.style.display = 'none';
            paletteModal.setAttribute('aria-hidden', 'true');
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        });
    }

    handleFocusTrap(e) {
        const activeModal = document.querySelector('.modal-overlay[style*="display: flex"]');
        if (!activeModal) return;

        const focusableElements = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new LifeFlowApp();
});

// Expose the class itself (not just the instance) so other classic
// scripts — e.g. pomodoro.js — can call the static
// LifeFlowApp.triggerLocalNotification() helper directly.
window.LifeFlowApp = LifeFlowApp;

export default LifeFlowApp;
