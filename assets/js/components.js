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
}
window.ComponentManager = ComponentManager;
