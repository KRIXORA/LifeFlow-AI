/**
 * @module DashboardModule
 * @description Enterprise-Grade Interactive Task Workflow with Search Filter, Dynamic Priority, Inline Editing, Confetti & Sound
 * @version 3.4.0
 */
class DashboardModule {
    constructor() {
        this.storageKey = 'dashboard_tasks';
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    init() {
        try {
            const dateDisplay = document.getElementById('currentDateDisplay');
            if (dateDisplay) {
                dateDisplay.textContent = Utils.formatDate();
            }

            const quickAddBtn = document.getElementById('quickAddBtn');
            const quickTaskInput = document.getElementById('quickTaskInput');

            if (quickAddBtn && quickTaskInput) {
                quickAddBtn.replaceWith(quickAddBtn.cloneNode(true));
                quickTaskInput.replaceWith(quickTaskInput.cloneNode(true));

                const freshAddBtn = document.getElementById('quickAddBtn');
                const freshTaskInput = document.getElementById('quickTaskInput');

                freshAddBtn.addEventListener('click', () => this.handleQuickAdd(freshTaskInput));
                freshTaskInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleQuickAdd(freshTaskInput);
                    }
                });
            }

            this.injectProfessionalDashboardControls();
            this.loadTasksWithSkeleton();
            this.updateGreeting();

            // Keep the greeting in sync whenever the user updates their name in Settings
            window.addEventListener('portfolioProfileUpdated', () => this.updateGreeting());
            window.addEventListener('lifeflowStateChange', (e) => {
                if (e.detail && e.detail.key === 'portfolio_settings') this.updateGreeting();
            });
        } catch (error) {
            console.error('[DashboardModule] Initialization failed:', error);
            ComponentManager.showToast('Failed to initialize dashboard task flow.', 'error');
        }
    }

    /**
     * Shows the user's actual saved name in the dashboard welcome message
     * instead of the hardcoded "Architect" placeholder.
     */
    updateGreeting() {
        const heroHeading = document.querySelector('.welcome-hero-card h2');
        if (!heroHeading) return;

        const settings = StorageManager.get('portfolio_settings', {});
        const name = (settings && settings.developerName && settings.developerName.trim()) || 'there';
        const percentSpan = heroHeading.querySelector('.highlight-gradient');
        const percentText = percentSpan ? percentSpan.outerHTML : '<span class="highlight-gradient">100%</span>';

        heroHeading.innerHTML = `Good day, ${Utils.escapeHTML(name)}. Your focus score is ${percentText}.`;
    }

    loadTasksWithSkeleton() {
        const list = document.getElementById('dashboardTaskList');
        if (list) {
            list.innerHTML = `
                <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="height: 20px; background: var(--border-glass); border-radius: var(--radius-sm); animation: pulse 1.5s infinite;"></div>
                    <div style="height: 20px; background: var(--border-glass); border-radius: var(--radius-sm); animation: pulse 1.5s infinite; width: 80%;"></div>
                </div>
            `;
        }

        setTimeout(() => {
            this.tasks = StorageManager.get(this.storageKey, [
                { id: 'task_d1', text: 'Plan out this week\'s goals', completed: true, tag: 'Planning', priority: 'High', createdAt: '10:00 AM' },
                { id: 'task_d2', text: 'Reply to pending emails', completed: false, tag: 'Personal', priority: 'Medium', createdAt: '10:15 AM' },
                { id: 'task_d3', text: 'Grocery shopping for the week', completed: false, tag: 'Errands', priority: 'Low', createdAt: '11:00 AM' }
            ]);
            this.renderTasks();
            this.updateDashboardMetrics();
        }, 600);
    }

    playCompletionSound() {
        const settings = StorageManager.get('portfolio_settings', { soundEnabled: true });
        if (settings.soundEnabled === false) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            console.log('AudioContext not supported or blocked', e);
        }
    }

    triggerConfetti() {
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    injectProfessionalDashboardControls() {
        const listContainer = document.getElementById('dashboardTaskList');
        if (!listContainer || document.getElementById('dashboardControlsRow')) return;

        const controlsRow = document.createElement('div');
        controlsRow.id = 'dashboardControlsRow';
        controlsRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;';
        
        controlsRow.innerHTML = `
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;" id="taskFilterTabs">
                <button class="btn btn-secondary active-filter" data-filter="all" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-full);">All Tasks</button>
                <button class="btn btn-secondary" data-filter="active" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-full);">Active</button>
                <button class="btn btn-secondary" data-filter="completed" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-full);">Completed</button>
            </div>
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <input type="text" id="taskSearchInput" placeholder="Search tasks..." style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-full); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); outline: none; width: 140px;">
                <button class="text-btn" id="completeAllTasksBtn" style="font-size: 0.75rem; color: var(--primary); background: none; border: none; cursor: pointer;">Complete All</button>
                <button class="text-btn" id="clearCompletedTasksBtn" style="font-size: 0.75rem; color: var(--danger); background: none; border: none; cursor: pointer;">Clear Completed</button>
            </div>
        `;

        listContainer.parentNode.insertBefore(controlsRow, listContainer);

        const filterBtns = controlsRow.querySelectorAll('#taskFilterTabs button');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active-filter'));
                e.target.classList.add('active-filter');
                this.currentFilter = e.target.getAttribute('data-filter');
                this.renderTasks();
            });
        });

        const searchInput = controlsRow.querySelector('#taskSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderTasks();
            });
        }

        const completeAllBtn = controlsRow.querySelector('#completeAllTasksBtn');
        if (completeAllBtn) {
            completeAllBtn.addEventListener('click', () => {
                this.tasks.forEach(t => t.completed = true);
                this.persistState();
                this.renderTasks();
                this.updateDashboardMetrics();
                this.playCompletionSound();
                this.triggerConfetti();
                ComponentManager.showToast('All workflow deliverables marked completed!', 'success');
            });
        }

        const clearCompletedBtn = controlsRow.querySelector('#clearCompletedTasksBtn');
        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener('click', () => {
                this.tasks = this.tasks.filter(t => !t.completed);
                this.persistState();
                this.renderTasks();
                this.updateDashboardMetrics();
                ComponentManager.showToast('Completed tasks cleared from workflow.', 'info');
            });
        }
    }

    handleQuickAdd(inputEl) {
        const text = inputEl.value.trim();
        if (text === '') {
            ComponentManager.showToast('Please provide a valid task description.', 'error');
            inputEl.focus();
            return;
        }
        this.addTask(text);
        inputEl.value = '';
    }

    addTask(text, tag = 'Personal', priority = 'High') {
        const newTask = {
            id: 'task_' + Date.now(),
            text,
            completed: false,
            tag,
            priority,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.tasks.unshift(newTask);
        this.persistState();
        this.renderTasks();
        this.updateDashboardMetrics();
        ComponentManager.showToast('Task added!', 'success');
    }

    persistState() {
        StorageManager.set(this.storageKey, this.tasks);
    }

    updateDashboardMetrics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const score = total > 0 ? Math.round((completed / total) * 100) : 100;

        const percentageEls = document.querySelectorAll('.ring-text .percentage, .highlight-gradient');
        percentageEls.forEach(el => {
            el.textContent = `${score}%`;
        });

        const ringFill = document.querySelector('.ring-fill');
        if (ringFill) {
            const offset = 314 - (314 * score / 100);
            ringFill.style.strokeDashoffset = offset;
        }

        const heroSubtitle = document.querySelector('.welcome-hero-card p');
        if (heroSubtitle) {
            const remainingCount = total - completed;
            heroSubtitle.textContent = remainingCount > 0
                ? `You have ${remainingCount} task${remainingCount === 1 ? '' : 's'} left to finish today. Keep going!`
                : `You're all caught up for today. Nice work!`;
        }
    }

    renderTasks() {
        const list = document.getElementById('dashboardTaskList');
        if (!list) return;
        
        list.innerHTML = '';

        let filteredTasks = this.tasks;
        
        if (this.currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(t => t.completed);
        }

        if (this.searchQuery) {
            filteredTasks = filteredTasks.filter(t => t.text.toLowerCase().includes(this.searchQuery));
        }

        if (!Array.isArray(filteredTasks) || filteredTasks.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-glass); border-radius: var(--radius-md);">
                    <i class="fa-regular fa-clipboard" style="font-size: 1.5rem; margin-bottom: 6px; display: block;"></i>
                    No priority flow tasks matching current filter or search parameters.
                </div>
            `;
            return;
        }

        filteredTasks.forEach((task) => {
            const originalIndex = this.tasks.findIndex(t => t.id === task.id);

            const row = document.createElement('div');
            row.className = 'task-item-row';
            row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background-color: var(--bg-main); border-radius: var(--radius-md); border: 1px solid var(--border-glass); transition: all 0.2s ease; gap: 12px;';

            const priorityColor = task.priority === 'Critical' ? 'var(--danger)' : task.priority === 'High' ? 'var(--warning)' : 'var(--primary)';

            row.innerHTML = `
                <label class="custom-checkbox" style="display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1; min-width: 0;">
                    <input type="checkbox" class="task-checkbox-input" ${task.completed ? 'checked' : ''} style="position: absolute; opacity: 0; cursor: pointer;">
                    <span class="checkmark"></span>
                    <span class="task-text ${task.completed ? 'completed' : ''}" style="word-break: break-word; font-size: 0.9rem;" title="Double-click to edit">${this.sanitizeHTML(task.text)}</span>
                </label>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <span class="badge soft-badge" style="border-left: 3px solid ${priorityColor};">${this.sanitizeHTML(task.priority || 'Medium')}</span>
                    <span class="badge soft-badge">${this.sanitizeHTML(task.tag || 'General')}</span>
                    <button class="icon-btn-delete-task" data-id="${task.id}" title="Delete Task" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; transition: color 0.2s;" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-muted)'">
                        <i class="fa-solid fa-xmark" style="font-size: 0.8rem;"></i>
                    </button>
                </div>
            `;

            const checkbox = row.querySelector('.task-checkbox-input');
            const taskText = row.querySelector('.task-text');
            const deleteBtn = row.querySelector('.icon-btn-delete-task');

            checkbox.addEventListener('change', () => {
                if (originalIndex !== -1) {
                    this.tasks[originalIndex].completed = checkbox.checked;
                    if (checkbox.checked) {
                        taskText.classList.add('completed');
                        this.playCompletionSound();
                        this.triggerConfetti();
                        ComponentManager.showToast('Deliverable marked as completed!', 'success');
                        if (typeof ComponentManager.addNotification === 'function') {
                            ComponentManager.addNotification('Task completed', `"${this.tasks[originalIndex].text}" marked as done.`);
                        }
                    } else {
                        taskText.classList.remove('completed');
                    }
                    this.persistState();
                    this.updateDashboardMetrics();
                }
            });

            taskText.addEventListener('dblclick', () => {
                const currentText = this.tasks[originalIndex].text;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.style.cssText = 'flex: 1; padding: 4px 8px; font-size: 0.9rem; border: 1px solid var(--primary); border-radius: var(--radius-sm); background: var(--bg-surface); color: var(--text-primary); outline: none;';
                
                taskText.replaceWith(input);
                input.focus();

                const saveEdit = () => {
                    const newText = input.value.trim();
                    if (newText && originalIndex !== -1) {
                        this.tasks[originalIndex].text = newText;
                        this.persistState();
                        this.renderTasks();
                        ComponentManager.showToast('Task updated successfully.', 'success');
                    } else {
                        this.renderTasks();
                    }
                };

                input.addEventListener('blur', saveEdit);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') saveEdit();
                });
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (originalIndex !== -1) {
                    const [removedTask] = this.tasks.splice(originalIndex, 1);
                    this.persistState();
                    this.renderTasks();
                    this.updateDashboardMetrics();
                    ComponentManager.showUndoToast(`"${removedTask.text}" deleted.`, () => {
                        this.tasks.splice(originalIndex, 0, removedTask);
                        this.persistState();
                        this.renderTasks();
                        this.updateDashboardMetrics();
                        ComponentManager.showToast('Task restored.', 'success');
                    });
                }
            });

            list.appendChild(row);
        });
    }

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
}

window.DashboardModule = DashboardModule;
