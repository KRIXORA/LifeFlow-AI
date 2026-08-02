/**
 * @module SettingsModule
 * @description User Profile, AI Assistant, and Data Backup Settings
 * @version 3.3.0
 */
class SettingsModule {
    constructor() {
        // Internal storage keys are kept as-is on purpose (other modules like
        // app.js, dashboard.js, ai-hub.js already read/write these same keys).
        // Renaming them would require updating every module that syncs state.
        this.storageKey = 'portfolio_settings';

        this.settings = StorageManager.get(this.storageKey, {
            developerName: 'Guest User',
            contactEmail: '',
            aiApiKey: ''
        });
        this.init();
    }

    init() {
        try {
            this.renderSettingsView();
        } catch (error) {
            console.error('[SettingsModule] Initialization failed:', error);
            ComponentManager.showToast('Failed to load settings.', 'error');
        }
    }

    renderSettingsView() {
        const viewSection = document.getElementById('view-settings');
        if (!viewSection) return;
        
        viewSection.innerHTML = `
            <div class="view-header-actions" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; width: 100%; box-sizing: border-box;">
                <div>
                    <h2>Settings</h2>
                    <p class="date-subtitle" style="word-break: break-word;">Manage your profile, AI assistant, and app data</p>
                </div>
            </div>
            
            <div class="settings-grid" style="display: grid; grid-template-columns: 100%; gap: 16px; width: 100%; max-width: 100%; box-sizing: border-box; overflow-x: hidden;">
                <!-- Profile Card -->
                <div class="glass-card settings-card" style="background: var(--bg-main); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 14px; width: 100%; box-sizing: border-box; overflow: hidden;">
                    <div class="settings-card-header" style="display: flex; gap: 12px; align-items: center; width: 100%; overflow: hidden;">
                        <div class="settings-icon-box primary-icon" style="background: var(--primary-light); color: var(--primary); width: 38px; height: 38px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fa-solid fa-user-gear"></i>
                        </div>
                        <div style="min-width: 0; overflow: hidden; flex: 1;">
                            <h3 style="font-size: 0.95rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Your Profile</h3>
                            <p style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Update your name and contact info</p>
                        </div>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                        <label for="portfolioNameInput" style="font-size: 0.85rem; font-weight: 500;">Your Name</label>
                        <input type="text" id="portfolioNameInput" value="${this.sanitizeHTML(this.settings.developerName)}" placeholder="e.g., Username" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                        <label for="portfolioEmailInput" style="font-size: 0.85rem; font-weight: 500;">Email (optional)</label>
                        <input type="email" id="portfolioEmailInput" value="${this.sanitizeHTML(this.settings.contactEmail)}" placeholder="name@domain.com" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                    </div>
                    <button class="btn btn-primary" id="saveProfileBtn" style="margin-top: 4px; width: 100%; box-sizing: border-box;">
                        <i class="fa-solid fa-floppy-disk"></i> Save Profile
                    </button>
                </div>

                <!-- AI Assistant Card -->
                <div class="glass-card settings-card" style="background: var(--bg-main); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 14px; width: 100%; box-sizing: border-box; overflow: hidden;">
                    <div class="settings-card-header" style="display: flex; gap: 12px; align-items: center; width: 100%; overflow: hidden;">
                        <div class="settings-icon-box success-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success); width: 38px; height: 38px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        <div style="min-width: 0; overflow: hidden; flex: 1;">
                            <h3 style="font-size: 0.95rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">AI Assistant</h3>
                            <p style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Optional — connect your own Gemini API key</p>
                        </div>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                        <label for="aiApiKeyInput" style="font-size: 0.85rem; font-weight: 500;">Gemini API Key</label>
                        <input type="password" id="aiApiKeyInput" value="${this.sanitizeHTML(this.settings.aiApiKey || '')}" placeholder="AIzaSy..." style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0; display: flex; align-items: flex-start; gap: 6px;">
                            <i class="fa-solid fa-triangle-exclamation" style="margin-top: 2px; flex-shrink: 0; color: #d97706;"></i>
                            <span>Without a key, the AI Hub uses a basic built-in assistant. Add your free Gemini key here for smarter, live AI replies. Stored only in this browser (not encrypted, not sent to us) — don't use this on a shared or public computer.</span>
                        </p>
                    </div>
                    <button class="btn btn-secondary" id="saveNetworksBtn" style="margin-top: 4px; width: 100%; box-sizing: border-box;">
                        <i class="fa-solid fa-link"></i> Save AI Settings
                    </button>
                </div>

                <!-- Data & Backup Card -->
                <div class="glass-card settings-card" style="background: var(--bg-main); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 14px; width: 100%; box-sizing: border-box; overflow: hidden;">
                    <div class="settings-card-header" style="display: flex; gap: 12px; align-items: center; width: 100%; overflow: hidden;">
                        <div class="settings-icon-box danger-icon" style="background: rgba(239, 68, 68, 0.1); color: var(--error); width: 38px; height: 38px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fa-solid fa-server"></i>
                        </div>
                        <div style="min-width: 0; overflow: hidden; flex: 1;">
                            <h3 style="font-size: 0.95rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Data & Backup</h3>
                            <p style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Save a copy of your data, or start fresh</p>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                        <div>
                            <h4 style="font-size: 0.9rem; font-weight: 600;">Backup & Restore</h4>
                            <p style="font-size: 0.75rem; color: var(--text-secondary);">Download all your tasks, goals, and habits as a file you can keep safe.</p>
                        </div>
                        <div style="display: flex; gap: 8px; width: 100%;">
                            <button class="btn btn-secondary" id="exportBackupBtn" style="flex: 1; padding: 10px 8px; font-size: 0.85rem;">
                                <i class="fa-solid fa-download"></i> Export
                            </button>
                            <button class="btn btn-secondary btn-outline-danger" id="resetDataBtn" style="flex: 1; padding: 10px 8px; font-size: 0.85rem;">
                                <i class="fa-solid fa-triangle-exclamation"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
    }

    bindEvents() {
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.handleSaveProfile());
        }
        const saveNetworksBtn = document.getElementById('saveNetworksBtn');
        if (saveNetworksBtn) {
            saveNetworksBtn.addEventListener('click', () => this.handleSaveNetworks());
        }
        const exportBackupBtn = document.getElementById('exportBackupBtn');
        if (exportBackupBtn) {
            exportBackupBtn.addEventListener('click', () => this.exportWorkspaceBackup());
        }
        const resetDataBtn = document.getElementById('resetDataBtn');
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', () => {
                if (confirm('This will permanently delete all your tasks, goals, habits, and settings from this device. This cannot be undone. Continue?')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }
    }

    handleSaveProfile() {
        const nameInput = document.getElementById('portfolioNameInput');
        const emailInput = document.getElementById('portfolioEmailInput');

        if (!nameInput || !emailInput) return;

        const developerName = nameInput.value.trim();
        const contactEmail = emailInput.value.trim();

        if (developerName === '') {
            ComponentManager.showToast('Please enter your name.', 'error');
            return;
        }

        this.settings.developerName = developerName;
        this.settings.contactEmail = contactEmail;

        this.persistState();

        const userNameEl = document.querySelector('.user-profile-card .user-name');
        if (userNameEl) {
            userNameEl.textContent = developerName;
        }

        window.dispatchEvent(new CustomEvent('portfolioProfileUpdated', { detail: this.settings }));
        ComponentManager.showToast('Profile updated!', 'success');
    }

    handleSaveNetworks() {
        const apiKeyInput = document.getElementById('aiApiKeyInput');

        if (!apiKeyInput) return;

        this.settings.aiApiKey = apiKeyInput.value.trim();

        // Ensure fresh state load and merge before persisting to protect schema integrity
        const existingSettings = StorageManager.get(this.storageKey, {});
        this.settings = { ...existingSettings, ...this.settings };

        this.persistState();
        
        // Dispatch custom event to notify other modules about credential updates
        window.dispatchEvent(new CustomEvent('lifeflowSettingsUpdated', { detail: this.settings }));
        ComponentManager.showToast('AI settings saved!', 'success');
    }

    exportWorkspaceBackup() {
        const allData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                allData[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                allData[key] = localStorage.getItem(key);
            }
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `lifeflow_backup_${Utils.fileTimestamp()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        ComponentManager.showToast('Backup downloaded successfully!', 'success');
    }

    persistState() {
        StorageManager.set(this.storageKey, this.settings);
    }

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str || '';
        return temp.innerHTML;
    }
}

window.SettingsModule = SettingsModule;
