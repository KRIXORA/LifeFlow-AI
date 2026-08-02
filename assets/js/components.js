/* Reusable Components Manager (Modals & Toasts) */
class ComponentManager {
    constructor() {
        this.initModal();
    }
    initModal() {
        this.overlay = document.getElementById('modalOverlay');
        this.titleEl = document.getElementById('modalTitle');
        this.bodyEl = document.getElementById('modalBody');
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.closeModal();
            });
        }
    }
    openModal(title, htmlContent) {
        if (this.titleEl) this.titleEl.textContent = title;
        if (this.bodyEl) this.bodyEl.innerHTML = htmlContent;
        if (this.overlay) this.overlay.classList.add('active');
    }
    closeModal() {
        if (this.overlay) this.overlay.classList.remove('active');
    }
    static showToast(message, type = 'success') {
        let container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';

        let iconClass = 'fa-solid fa-circle-check success';
        if (type === 'error') iconClass = 'fa-solid fa-circle-xmark error';
        if (type === 'info') iconClass = 'fa-solid fa-circle-info info';
        toast.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Shows a toast with an "Undo" button so accidental deletes (task, goal,
     * habit, planner item) can be reversed within a short window instead of
     * being permanently lost with no way back.
     */
    static showUndoToast(message, undoCallback, durationMs = 5000) {
        let container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.innerHTML = `
            <i class="fa-solid fa-trash-can" style="color: var(--text-secondary);"></i>
            <span style="flex: 1;">${ComponentManager._escapeHTML(message)}</span>
            <button type="button" style="background: none; border: none; color: var(--primary); font-weight: 600; font-size: 0.8rem; cursor: pointer; padding: 4px 8px;">Undo</button>
        `;
        container.appendChild(toast);

        let dismissed = false;
        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('button').addEventListener('click', () => {
            if (typeof undoCallback === 'function') undoCallback();
            dismiss();
        });

        setTimeout(dismiss, durationMs);
    }

    // Static wrappers so ComponentManager.openModal()/closeModal() also work
    // (not just the instance-based window.componentManager.openModal()).
    // Ensures a single shared instance always exists, so callers can use
    // either style safely without risk of "openModal is not a function".
    static _getInstance() {
        if (!window.componentManager) {
            window.componentManager = new ComponentManager();
        }
        return window.componentManager;
    }
    static openModal(title, htmlContent) {
        ComponentManager._getInstance().openModal(title, htmlContent);
    }
    static closeModal() {
        ComponentManager._getInstance().closeModal();
    }

    // ---- Real Notification Center (bell icon dropdown) ----
    // Replaces the old hardcoded/static notification list with one
    // driven by actual app events (Pomodoro sessions, etc.).

    static _escapeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str || '';
        return temp.innerHTML;
    }

    /** Add a real notification entry and refresh the bell dropdown. */
    static addNotification(title, body) {
        const list = StorageManager.get('app_notifications', []);
        list.unshift({
            title,
            body,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        // Keep it bounded so storage doesn't grow forever.
        if (list.length > 20) list.length = 20;
        StorageManager.set('app_notifications', list);
        ComponentManager.renderNotificationList();
    }

    /** Re-render the bell dropdown + badges from stored notifications. */
    static renderNotificationList() {
        const list = StorageManager.get('app_notifications', []);
        const container = document.getElementById('notificationList');
        const badge = document.getElementById('notificationBadge');
        const countBadge = document.getElementById('notificationCountBadge');

        if (container) {
            if (list.length === 0) {
                container.innerHTML = `<div style="padding: 16px; text-align: center; font-size: 0.85rem; color: var(--text-secondary);">No new notifications</div>`;
            } else {
                container.innerHTML = list.map(n => `
                    <div class="notification-item" style="padding: 8px; font-size: 0.85rem; border-radius: var(--radius-sm); background: var(--bg-main);">
                        <strong>${ComponentManager._escapeHTML(n.title)}</strong>
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; margin-bottom: 0;">${ComponentManager._escapeHTML(n.body)}</p>
                    </div>
                `).join('');
            }
        }
        if (badge) badge.style.display = list.length > 0 ? 'inline-block' : 'none';
        if (countBadge) countBadge.textContent = `${list.length} New`;
    }

    /** Clear all stored notifications and refresh the dropdown. */
    static clearNotifications() {
        StorageManager.set('app_notifications', []);
        ComponentManager.renderNotificationList();
    }
}
window.ComponentManager = ComponentManager;
