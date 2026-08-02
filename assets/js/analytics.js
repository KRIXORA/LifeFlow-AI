/**
 * @module AnalyticsModule
 * @description Productivity & Focus Analytics with Target Management & Visual Breakdown
 * @version 2.9.0
 */
class AnalyticsModule {
    constructor() {
        this.storageKey = 'analytics_metrics';
        this.dashboardStorageKey = 'dashboard_tasks';
        this.habitsStorageKey = 'user_habits';
        this.selectedTimeRange = StorageManager.get('analytics_timerange', 'weekly');
        this.targetFocusHours = StorageManager.get('analytics_target_hours', 40);

        this.loadRealTimeMetrics();
        this.init();
    }

    /**
     * Reads real completed Pomodoro sessions from storage and sums up
     * focus minutes within the given date range.
     */
    getFocusSessionsInRange(startDate, endDate) {
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('lifeflow_pomodoro_history') || '[]');
        } catch (e) {
            history = [];
        }
        return history.filter(s => {
            const t = new Date(s.timestamp);
            return t >= startDate && t < endDate;
        });
    }

    /**
     * Calculates real-time metrics dynamically based on selected time range and targets.
     * Focus hours now come from actual completed Pomodoro sessions instead of a
     * fixed placeholder number, so numbers reflect what the user has really done.
     */
    loadRealTimeMetrics() {
        const tasks = StorageManager.get(this.dashboardStorageKey, []);
        const habits = StorageManager.get(this.habitsStorageKey, []);

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const completedHabits = habits.filter(h => h.completedToday).length;
        const totalHabits = habits.length;
        const habitScore = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

        let calculatedEnergy = 'Steady';
        if (taskCompletionRate > 80 && habitScore > 70) {
            calculatedEnergy = 'Peak Performance';
        } else if (taskCompletionRate < 40 && totalTasks > 0) {
            calculatedEnergy = 'Needs a Boost';
        }

        // Work out the current period's date range
        const now = new Date();
        let periodDays = 7;
        if (this.selectedTimeRange === 'monthly') periodDays = 30;
        if (this.selectedTimeRange === 'yearly') periodDays = 365;

        const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
        const prevPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

        const currentSessions = this.getFocusSessionsInRange(periodStart, now);
        const previousSessions = this.getFocusSessionsInRange(prevPeriodStart, periodStart);

        const currentFocusHours = +(currentSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60).toFixed(1);
        const previousFocusHours = +(previousSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60).toFixed(1);

        let focusHoursTrend;
        if (previousFocusHours === 0 && currentFocusHours === 0) {
            focusHoursTrend = 'No focus sessions logged yet';
        } else if (previousFocusHours === 0) {
            focusHoursTrend = 'First sessions logged this period';
        } else {
            const changePercent = Math.round(((currentFocusHours - previousFocusHours) / previousFocusHours) * 100);
            focusHoursTrend = `${changePercent >= 0 ? '+' : ''}${changePercent}% vs previous period`;
        }

        // Find the hour of day the user most often starts a focus session
        let peakHours = 'Not enough data yet';
        if (currentSessions.length > 0) {
            const hourCounts = {};
            currentSessions.forEach(s => {
                const h = new Date(s.timestamp).getHours();
                hourCounts[h] = (hourCounts[h] || 0) + 1;
            });
            const bestHour = Object.keys(hourCounts).sort((a, b) => hourCounts[b] - hourCounts[a])[0];
            const hourNum = parseInt(bestHour, 10);
            const label = (h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
            peakHours = `Around ${label(hourNum)}`;
        }

        const targetMultiplier = this.selectedTimeRange === 'monthly' ? this.targetFocusHours * 4 : (this.selectedTimeRange === 'yearly' ? this.targetFocusHours * 52 : this.targetFocusHours);
        const focusProgressPercent = targetMultiplier > 0 ? Math.min(100, Math.round((currentFocusHours / targetMultiplier) * 100)) : 0;

        const defaultMetrics = {
            focusHoursWeekly: currentFocusHours,
            targetHours: targetMultiplier,
            focusProgress: focusProgressPercent,
            focusHoursTrend: focusHoursTrend,
            taskCompletionRate: taskCompletionRate,
            completedTasksCount: completedTasks,
            energyIndex: calculatedEnergy,
            peakHours: peakHours
        };

        this.metrics = defaultMetrics;
        this.persistState();
    }

    init() {
        try {
            this.renderAnalyticsView();
        } catch (error) {
            console.error('[AnalyticsModule] Initialization failed:', error);
            ComponentManager.showToast('Failed to load Analytics.', 'error');
        }
    }

    renderAnalyticsView() {
        this.loadRealTimeMetrics();

        const viewSection = document.getElementById('view-analytics');
        if (!viewSection) return;

        viewSection.innerHTML = `
            <div class="view-header-actions" style="margin-bottom: 24px; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: center;">
                <div>
                    <h2>Productivity & Focus Analytics</h2>
                    <p class="date-subtitle">See your focus time, task progress, and habits at a glance</p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <select id="analyticsTimeRange" style="padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.8rem;" title="Select Time Range">
                        <option value="weekly" ${this.selectedTimeRange === 'weekly' ? 'selected' : ''}>This Week</option>
                        <option value="monthly" ${this.selectedTimeRange === 'monthly' ? 'selected' : ''}>This Month</option>
                        <option value="yearly" ${this.selectedTimeRange === 'yearly' ? 'selected' : ''}>This Year</option>
                    </select>

                    <button class="btn btn-secondary" id="setTargetHoursBtn" style="padding: 8px 12px; font-size: 0.8rem;" title="Set Focus Target">
                        <i class="fa-solid fa-bullseye"></i> Target
                    </button>

                    <button class="btn btn-secondary" id="exportReportBtn" style="padding: 8px 12px; font-size: 0.8rem;" title="Export Report">
                        <i class="fa-solid fa-download"></i> Export
                    </button>

                    <button class="btn btn-secondary" id="refreshAnalyticsBtn" style="padding: 8px 12px; font-size: 0.8rem;">
                        <i class="fa-solid fa-rotate"></i> Sync
                    </button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px;">
                <!-- Focus Hours Card -->
                <div class="glass-card" style="background: var(--bg-main); border-radius: var(--radius-md); padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h3 style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 500;">Focus Hours (${this.selectedTimeRange})</h3>
                        <div style="background: var(--primary-light); color: var(--primary); width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-stopwatch"></i>
                        </div>
                    </div>
                    <p style="font-size: 2.2rem; font-family: 'Outfit', sans-serif; font-weight: 700; color: var(--primary); margin: 12px 0;">${this.metrics.focusHoursWeekly} hrs</p>
                    <div style="width: 100%; height: 6px; background: var(--border-glass); border-radius: var(--radius-full); overflow: hidden; margin-top: 8px;">
                        <div style="width: ${this.metrics.focusProgress}%; height: 100%; background: var(--primary); border-radius: var(--radius-full); transition: width 0.5s ease;"></div>
                    </div>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-top: 6px;">Target: ${this.metrics.targetHours} hrs (${this.metrics.focusProgress}% achieved)</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">${this.sanitizeHTML(this.metrics.focusHoursTrend)}</span>
                </div>

                <!-- Task Completion Rate Card -->
                <div class="glass-card" style="background: var(--bg-main); border-radius: var(--radius-md); padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h3 style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 500;">Task Completion Rate</h3>
                        <div style="background: rgba(16, 185, 129, 0.1); color: var(--success); width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-list-check"></i>
                        </div>
                    </div>
                    <p style="font-size: 2.2rem; font-family: 'Outfit', sans-serif; font-weight: 700; color: var(--success); margin: 12px 0;">${this.metrics.taskCompletionRate}%</p>
                    <div style="width: 100%; height: 6px; background: var(--border-glass); border-radius: var(--radius-full); overflow: hidden; margin-top: 8px;">
                        <div style="width: ${this.metrics.taskCompletionRate}%; height: 100%; background: var(--success); border-radius: var(--radius-full); transition: width 0.5s ease;"></div>
                    </div>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-top: 6px;">Based on ${this.metrics.completedTasksCount} completed tasks</span>
                </div>

                <!-- System Energy Index Card -->
                <div class="glass-card" style="background: var(--bg-main); border-radius: var(--radius-md); padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h3 style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 500;">Energy Level</h3>
                        <div style="background: rgba(245, 158, 11, 0.1); color: var(--warning); width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                    </div>
                    <p style="font-size: 2.2rem; font-family: 'Outfit', sans-serif; font-weight: 700; color: var(--warning); margin: 12px 0;">${this.sanitizeHTML(this.metrics.energyIndex)}</p>
                    <span style="font-size: 0.85rem; color: var(--text-secondary); display: block; margin-top: 24px;">Your best focus time: ${this.sanitizeHTML(this.metrics.peakHours)}</span>
                </div>
            </div>

            <!-- Insights & Recommendations Panel -->
            <div class="glass-card" style="display: flex; flex-direction: column; gap: 16px; background: var(--bg-main); border-radius: var(--radius-md); padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="font-size: 1.1rem; font-weight: 600;"><i class="fa-solid fa-lightbulb"></i> Insights & Recommendations</h3>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">
                    You're completing <strong style="color: var(--success);">${this.metrics.taskCompletionRate}%</strong> of your tasks right now.
                    ${this.metrics.taskCompletionRate > 80 ? '<i class="fa-solid fa-rocket" style="color: var(--success);"></i> Great momentum — keep it up during your best focus hours!' : '<i class="fa-solid fa-lightbulb" style="color: var(--warning);"></i> Try breaking bigger tasks into smaller steps to build momentum.'}
                </p>
                <div style="display: flex; gap: 12px; margin-top: 8px;">
                    <button class="btn btn-primary" onclick="window.router.navigateTo('ai-hub')">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Ask AI for Tips
                    </button>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refreshAnalyticsBtn');
        const timeRangeSelect = document.getElementById('analyticsTimeRange');
        const exportBtn = document.getElementById('exportReportBtn');
        const targetBtn = document.getElementById('setTargetHoursBtn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                ComponentManager.showToast('Refreshing your analytics...', 'info');
                setTimeout(() => {
                    this.loadRealTimeMetrics();
                    this.renderAnalyticsView();
                    ComponentManager.showToast('Analytics updated!', 'success');
                }, 600);
            });
        }

        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.selectedTimeRange = e.target.value;
                StorageManager.set('analytics_timerange', this.selectedTimeRange);
                this.loadRealTimeMetrics();
                this.renderAnalyticsView();
                ComponentManager.showToast(`Analytics updated for ${this.selectedTimeRange}`, 'success');
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAnalyticsCSV());
        }

        if (targetBtn) {
            targetBtn.addEventListener('click', () => this.openTargetModal());
        }
    }

    openTargetModal() {
        const modalHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <label for="targetHoursInput" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Set Weekly Focus Target (Hours)</label>
                <input type="number" id="targetHoursInput" min="5" max="100" value="${this.targetFocusHours}" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                <button class="btn btn-primary" id="saveTargetBtn" style="margin-top: 8px; width: 100%;">
                    <i class="fa-solid fa-floppy-disk"></i> Save Target
                </button>
            </div>
        `;

        window.componentManager = window.componentManager || new ComponentManager();
        componentManager.openModal('Configure Focus Target', modalHTML);

        document.getElementById('saveTargetBtn')?.addEventListener('click', () => {
            const val = parseInt(document.getElementById('targetHoursInput')?.value);
            if (!isNaN(val) && val > 0) {
                this.targetFocusHours = val;
                StorageManager.set('analytics_target_hours', this.targetFocusHours);
                window.componentManager.closeModal();
                this.loadRealTimeMetrics();
                this.renderAnalyticsView();
                ComponentManager.showToast('Focus target updated successfully!', 'success');
            } else {
                ComponentManager.showToast('Please enter a valid target number.', 'error');
            }
        });
    }

    exportAnalyticsCSV() {
        const reportData = `Metric,Value\nTime Range,${this.selectedTimeRange}\nFocus Hours,${this.metrics.focusHoursWeekly}\nTarget Hours,${this.metrics.targetHours}\nTask Completion Rate,${this.metrics.taskCompletionRate}%\nCompleted Tasks,${this.metrics.completedTasksCount}\nEnergy Index,${this.metrics.energyIndex}\nPeak Hours,${this.metrics.peakHours}`;
        const blob = new Blob([reportData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `lifeflow_analytics_${this.selectedTimeRange}_${Utils.fileTimestamp()}.csv`);
        document.body.appendChild(a);
        a.click();
        a.remove();
        ComponentManager.showToast('Analytics exported as CSV.', 'success');
    }

    persistState() {
        StorageManager.set(this.storageKey, this.metrics);
    }

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
}

window.AnalyticsModule = AnalyticsModule;
