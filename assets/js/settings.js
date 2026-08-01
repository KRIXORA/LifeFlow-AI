/**
 * @module SettingsModule
 * @description Professional Portfolio Control Center & System Architecture Preferences with API Keys, Theme Switcher, and Backup Management
 * @version 3.2.3-Enterprise-Responsive
 * @author Architect Pro
 */
class SettingsModule {
    constructor() {
        this.storageKey = 'portfolio_settings';
        this.profileKey = 'portfolio_profile_config';

        this.settings = StorageManager.get(this.storageKey, {
            developerName: 'Architect Pro',
            professionalTitle: 'Full-Stack Software Architect & AI Systems Engineer',
            contactEmail: 'architect.pro@lifeflow.ai',
            githubUrl: 'https://github.com',
            linkedinUrl: 'https://linkedin.com',
            portfolioTheme: 'Dynamic Glassmorphism',
            availabilityStatus: 'Available for Enterprise Contracts',
            aiApiKey: ''
        });
        this.init();
    }

    init() {
        try {
            this.renderSettingsView();
        } catch (error) {
            console.error('[SettingsModule] Initialization failed:', error);
            ComponentManager.showToast('Failed to initialize portfolio settings.', 'error');
        }
    }

    renderSettingsView() {
        const viewSection = document.getElementById('view-settings');
        if (!viewSection) return;
        
        viewSection.innerHTML = `
            <div class="view-header-actions" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; width: 100%; box-sizing: border-box;">
                <div>
                    <h2>Portfolio Architecture & System Preferences</h2>
                    <p class="date-subtitle" style="word-break: break-word;">Configure your developer profile, AI API credentials, and system workspace storage</p>
                </div>
                <span class="badge soft-badge" style="white-space: nowrap;"><i class="fa-solid fa-shield-halved"></i> System Pipeline: Active</span>
            </div>
            
            <div class="settings-grid" style="display: grid; grid-template-columns: 100%; gap: 16px; width: 100%; max-width: 100%; box-sizing: border-box; overflow-x: hidden;">
                <!-- Profile & Branding Card -->
                <div class="glass-card settings-card" style="background: var(--bg-main); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 14px; width: 100%; box-sizing: border-box; overflow: hidden;">
                    <div class="settings-card-header" style="display: flex; gap: 12px; align-items: center; width: 100%; overflow: hidden;">
                        <div class="settings-icon-box primary-icon" style="background: var(--primary-light); color: var(--primary); width: 38px; height: 38px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fa-solid fa-user-gear"></i>
                        </div>
                        <div style="min-width: 0; overflow: hidden; flex: 1;">
                            <h3 style="font-size: 0.95rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Developer Profile Identity</h3>
                            <p style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Update your public engineering details</p>
                        </div>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                        <label for="portfolioNameInput" style="font-size: 0.85rem; font-weight: 500;">Professional Name</label>
                        <input type="text" id="portfolioNameInput" value="${this.sanitizeHTML(this.settings.developerName)}" placeholder="e.g., Architect Pro" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                        <label for="portfolioTitleInput" style="font-size: 0.85rem; font-weight: 500;">Core Specialization Title</label>
                        <input type="text" id="portfolioTitleInput" value="${this.sanitizeHTML(this.settings.professionalTitle)}" placeholder="e.g., Senior AI Systems Architect" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                        <label for="portfolioEmailInput" style="font-size: 0.85rem; font-weight: 500;">Professional Contact Email</label>
                        <input type="email" id="portfolioEmailInput" value="${this.sanitizeHTML(this.settings.contactEmail)}" placeholder="name@domain.com" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                    </div>
                    <button class="btn btn-primary" id="saveProfileBtn" style="margin-top: 4px; width: 100%; box-sizing: border-box;">
                        <i class="fa-solid fa-floppy-disk"></i> Save Profile Identity
                    </button>
                </div>

                <!-- Professional Links & AI Integration -->
                <div class="glass-card settings-card" style="background: var(--bg-main); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 14px; width: 100%; box-sizing: border-box; overflow: hidden;">
                    <div class="settings-card-header" style="display: flex; gap: 12px; align-items: center; width: 100%; overflow: hidden;">
                        <div class="settings-icon-box success-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success); width: 38px; height: 38px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        <div style="min-width: 0; overflow: hidden; flex: 1;">
                            <h3 style="font-size: 0.95rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Networks & AI Credentials</h3>
                            <p style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Manage developer links & Gemini API Key</p>
                        </div>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                        <label for="portfolioGithubInput" style="font-size: 0.85rem; font-weight: 500;">GitHub Profile URL</label>
                        <input type="url" id="portfolioGithubInput" value="${this.sanitizeHTML(this.settings.githubUrl)}" placeholder="https://github.com/username" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                        <label for="aiApiKeyInput" style="font-size: 0.85rem; font-weight: 500;">Gemini API Key (Live AI Support)</label>
                        <input type="password" id="aiApiKeyInput" value="${this.sanitizeHTML(this.settings.aiApiKey || '')}" placeholder="AIzaSy..." style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                        <label for="portfolioStatusSelect" style="font-size: 0.85rem; font-weight: 500;">Career Availability Status</label>
                        <select id="portfolioStatusSelect" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                            <option value="Available for Enterprise Contracts" ${this.settings.availabilityStatus === 'Available for Enterprise Contracts' ? 'selected' : ''}>Available for Enterprise Contracts</option>
                            <option value="Open to Full-Time Roles" ${this.settings.availabilityStatus === 'Open to Full-Time Roles' ? 'selected' : ''}>Open to Full-Time Roles</option>
                            <option value="Engaged in Deep Focus / Inactive" ${this.settings.availabilityStatus === 'Engaged in Deep Focus / Inactive' ? 'selected' : ''}>Engaged in Deep Focus / Inactive</option>
                        </select>
                    </div>
                    <button class="btn btn-secondary" id="saveNetworksBtn" style="margin-top: 4px; width: 100%; box-sizing: border-box;">
                        <i class="fa-solid fa-link"></i> Save Networks & API Key
                    </button>
                </div>

                <!-- System Telemetry & Backup Data Management -->
                <div class="glass-card settings-card" style="background: var(--bg-main); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 14px; width: 100%; box-sizing: border-box; overflow: hidden;">
                    <div class="settings-card-header" style="display: flex; gap: 12px; align-items: center; width: 100%; overflow: hidden;">
                        <div class="settings-icon-box danger-icon" style="background: rgba(239, 68, 68, 0.1); color: var(--error); width: 38px; height: 38px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fa-solid fa-server"></i>
                        </div>
                        <div style="min-width: 0; overflow: hidden; flex: 1;">
                            <h3 style="font-size: 0.95rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">System Telemetry & Backup</h3>
                            <p style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Export workspace state backups or reset</p>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                        <div>
                            <h4 style="font-size: 0.9rem; font-weight: 600;">Workspace State Backup & Restore</h4>
                            <p style="font-size: 0.75rem; color: var(--text-secondary);">Download complete local storage state as a JSON file.</p>
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
                if (confirm('Are you sure you want to clear all local storage telemetry and reset the portfolio state?')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }
    }

    handleSaveProfile() {
        const nameInput = document.getElementById('portfolioNameInput');
        const titleInput = document.getElementById('portfolioTitleInput');
        const emailInput = document.getElementById('portfolioEmailInput');

        if (!nameInput || !titleInput || !emailInput) return;

        const developerName = nameInput.value.trim();
        const professionalTitle = titleInput.value.trim();
        const contactEmail = emailInput.value.trim();

        if (developerName === '' || professionalTitle === '') {
            ComponentManager.showToast('Please provide valid professional name and title.', 'error');
            return;
        }

        this.settings.developerName = developerName;
        this.settings.professionalTitle = professionalTitle;
        this.settings.contactEmail = contactEmail;

        this.persistState();

        const userNameEl = document.querySelector('.user-profile-card .user-name');
        if (userNameEl) {
            userNameEl.textContent = developerName;
        }

        window.dispatchEvent(new CustomEvent('portfolioProfileUpdated', { detail: this.settings }));
        ComponentManager.showToast('Developer profile identity successfully updated!', 'success');
    }

    handleSaveNetworks() {
        const githubInput = document.getElementById('portfolioGithubInput');
        const apiKeyInput = document.getElementById('aiApiKeyInput');
        const statusSelect = document.getElementById('portfolioStatusSelect');

        if (!githubInput || !apiKeyInput || !statusSelect) return;

        this.settings.githubUrl = githubInput.value.trim();
        this.settings.aiApiKey = apiKeyInput.value.trim();
        this.settings.availabilityStatus = statusSelect.value;

        // Ensure fresh state load and merge before persisting to protect schema integrity
        const existingSettings = StorageManager.get(this.storageKey, {});
        this.settings = { ...existingSettings, ...this.settings };

        this.persistState();
        
        // Dispatch custom event to notify other modules about credential updates
        window.dispatchEvent(new CustomEvent('lifeflowSettingsUpdated', { detail: this.settings }));
        ComponentManager.showToast('Professional network parameters and API credentials saved!', 'success');
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
        downloadAnchor.setAttribute("download", `lifeflow_complete_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        ComponentManager.showToast('Complete workspace backup exported successfully!', 'success');
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
