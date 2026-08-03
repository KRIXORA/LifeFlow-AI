/**
 * Main App Orchestrator with Focus Trapping, Keyboard Navigation & PWA Push Notifications
 * Note: runs as a plain script (not an ES module) so the app works even when
 * index.html is opened directly by double-clicking it (file:// protocol),
 * where ES module imports get blocked by CORS.
 */
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

        const closePaletteBtn = document.getElementById('closeCommandPalette');
        const paletteModal = document.getElementById('commandPaletteModal');
        if (closePaletteBtn && paletteModal) {
            closePaletteBtn.addEventListener('click', () => this.toggleCommandPalette(false));
            paletteModal.addEventListener('click', (e) => {
                if (e.target === paletteModal) this.toggleCommandPalette(false);
            });
        }

        const paletteInput = document.getElementById('commandPaletteInput');
        const dynamicResults = document.getElementById('commandPaletteDynamicResults');
        if (paletteInput) {
            paletteInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase().trim();

                // Filter the static nav shortcuts (Go to Dashboard, etc.)
                const items = document.querySelectorAll('#commandPaletteStaticGroup .command-item');
                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(val) ? 'flex' : 'none';
                });

                // Search real app data (tasks, planner items, goals, habits)
                if (dynamicResults) {
                    if (val === '') {
                        dynamicResults.style.display = 'none';
                        dynamicResults.innerHTML = '';
                    } else {
                        const matches = this.searchWorkspace(val);
                        dynamicResults.style.display = 'flex';
                        if (matches.length === 0) {
                            dynamicResults.innerHTML = `<div style="padding: 10px 12px; font-size: 0.85rem; color: var(--text-secondary);">No matching tasks, goals, or habits found.</div>`;
                        } else {
                            dynamicResults.innerHTML = matches.map(m => `
                                <div class="command-item" data-target="${m.target}" style="padding: 10px 12px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; gap: 10px;" role="option" tabindex="0">
                                    <i class="fa-solid ${m.icon}" style="color: var(--primary);" aria-hidden="true"></i>
                                    <div style="display: flex; flex-direction: column; min-width: 0;">
                                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.label}</span>
                                        <span style="font-size: 0.7rem; color: var(--text-secondary);">${m.sublabel}</span>
                                    </div>
                                </div>
                            `).join('');
                        }
                    }
                }
            });
        }

        // Click delegation: works for both static nav shortcuts and dynamically
        // inserted search-result items (which don't exist at page-load time).
        const paletteResults = document.getElementById('commandPaletteResults');
        if (paletteResults) {
            paletteResults.addEventListener('click', (e) => {
                const item = e.target.closest('.command-item');
                if (!item) return;
                const target = item.getAttribute('data-target');
                if (target && window.router) {
                    window.router.navigateTo(target);
                    this.toggleCommandPalette(false);
                }
            });
        }

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
        
        // Let the user know (once) if a CDN-hosted feature library failed to
        // load — e.g. due to no internet connection — instead of drag-and-drop
        // reordering silently not working with no explanation.
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (typeof Sortable === 'undefined' && typeof ComponentManager !== 'undefined') {
                    ComponentManager.showToast('Drag-and-drop reordering is unavailable right now — check your internet connection.', 'info');
                }
            }, 1500);
        });

        
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .catch(err => console.error('ServiceWorker registration failed:', err));
            });
        }
    }

    async requestNotificationPermission() {
        if (this._notificationPromptShown) return;
        if ('Notification' in window && 'serviceWorker' in navigator) {
            if (Notification.permission === 'default') {
                this._notificationPromptShown = true;
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.subscribeUserToPush();
                } else {
                    console.warn('Notification permission denied.');
                }
            }
        }
    }

    async subscribeUserToPush() {
        try {
            await navigator.serviceWorker.ready;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        }
    }

    static triggerLocalNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body: body,
                    icon: 'assets/icons/icon-192.png?v=3',
                    vibrate: [200, 100, 200]
                });
            });
        }
    }

    toggleCommandPalette(show) {
        const paletteModal = document.getElementById('commandPaletteModal');
        const paletteInput = document.getElementById('commandPaletteInput');
        const dynamicResults = document.getElementById('commandPaletteDynamicResults');
        const staticItems = document.querySelectorAll('#commandPaletteStaticGroup .command-item');
        if (!paletteModal) return;

        if (show) {
            paletteModal.style.display = 'flex';
            paletteModal.setAttribute('aria-hidden', 'false');
            if (paletteInput) {
                paletteInput.value = '';
                paletteInput.focus();
            }
            if (dynamicResults) {
                dynamicResults.style.display = 'none';
                dynamicResults.innerHTML = '';
            }
            staticItems.forEach(item => { item.style.display = 'flex'; });
        } else {
            paletteModal.style.display = 'none';
            paletteModal.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Searches real workspace data (dashboard tasks, planner tasks, goals,
     * habits) for the given query and returns matches ready for rendering
     * in the command palette. Capped to keep the dropdown readable.
     */
    searchWorkspace(query) {
        const results = [];
        const MAX_RESULTS = 8;

        try {
            const dashboardTasks = window.storage.get('dashboard_tasks', []) || [];
            dashboardTasks.forEach(t => {
                if (t.text && t.text.toLowerCase().includes(query)) {
                    results.push({ icon: 'fa-list-check', label: t.text, sublabel: `Task · ${t.completed ? 'Completed' : 'Pending'}`, target: 'dashboard' });
                }
            });

            const plannerTasks = window.storage.get('planner_tasks', {}) || {};
            Object.keys(plannerTasks).forEach(slot => {
                (plannerTasks[slot] || []).forEach(t => {
                    if (t.title && t.title.toLowerCase().includes(query)) {
                        results.push({ icon: 'fa-calendar-day', label: t.title, sublabel: `Planner · ${slot.charAt(0).toUpperCase() + slot.slice(1)}`, target: 'planner' });
                    }
                });
            });

            const goals = window.storage.get('user_goals', []) || [];
            goals.forEach(g => {
                if (g.title && g.title.toLowerCase().includes(query)) {
                    results.push({ icon: 'fa-bullseye', label: g.title, sublabel: `Goal · ${g.progress || 0}% complete`, target: 'goals' });
                }
            });

            const habits = window.storage.get('user_habits', []) || [];
            habits.forEach(h => {
                if (h.name && h.name.toLowerCase().includes(query)) {
                    results.push({ icon: 'fa-repeat', label: h.name, sublabel: `Habit · ${h.streak || 0} day streak`, target: 'habits' });
                }
            });
        } catch (error) {
            console.error('[LifeFlowApp] Search failed:', error);
        }

        return results.slice(0, MAX_RESULTS);
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
