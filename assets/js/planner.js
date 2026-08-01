/**
 * @module PlannerModule
 * @description Advanced Daily Time-Blocking & Intelligent Task Architecture Manager with Same-Slot Sortable, Date Filter, Pomodoro Timer, Batch Actions, and Progress Analytics
 * @version 4.1.0
 * @author Architect Pro
 */
class PlannerModule {
    constructor() {
        this.storageKey = 'planner_tasks';
        this.slotsStorageKey = 'planner_custom_slots';
        this.selectedDate = new Date().toISOString().split('T')[0];
        
        this.timeSlots = StorageManager.get(this.slotsStorageKey, [
            { id: 'morning', label: 'Morning Matrix', time: '06:00 - 12:00', icon: 'fa-mug-hot' },
            { id: 'afternoon', label: 'Afternoon Block', time: '12:00 - 18:00', icon: 'fa-sun' },
            { id: 'evening', label: 'Evening Wind-down', time: '18:00 - 22:00', icon: 'fa-moon' }
        ]);

        this.plannerTasks = StorageManager.get(this.storageKey, {
            morning: [
                { id: 'task_m1', title: 'Review System Metrics & Telemetry', completed: false, scheduled: true, priority: 'high', duration: '45 mins', date: this.selectedDate, subtasks: [{text: 'Check server logs', done: true}, {text: 'Verify API health', done: false}], createdAt: new Date().toISOString() }
            ],
            afternoon: [
                { id: 'task_a1', title: 'Deep Work Code Refactoring & Architecture', completed: false, scheduled: true, priority: 'critical', duration: '2 hrs', date: this.selectedDate, subtasks: [], createdAt: new Date().toISOString() }
            ],
            evening: [
                { id: 'task_e1', title: 'Team Sync & Milestone Progress Review', completed: false, scheduled: true, priority: 'medium', duration: '1 hr', date: this.selectedDate, subtasks: [], createdAt: new Date().toISOString() }
            ]
        });

        this.init();
        this.bindGlobalSyncEvents();
    }

    init() {
        try {
            this.renderPlannerWrapper();
            this.bindEvents();
            this.renderPlanner();
            this.initSortable();
        } catch (error) {
            console.error('[PlannerModule] Initialization failed:', error);
            ComponentManager.showToast('Failed to initialize Smart Planner.', 'error');
        }
    }

    bindGlobalSyncEvents() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'lifeflow_' + this.storageKey) {
                this.plannerTasks = StorageManager.get(this.storageKey, {});
                this.renderPlanner();
                this.initSortable();
            }
        });
    }

    renderPlannerWrapper() {
        const viewSection = document.getElementById('view-planner');
        if (!viewSection) return;

        viewSection.innerHTML = `
            <div class="view-header-actions" style="flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
                <div>
                    <h2>Smart Daily Planner</h2>
                    <p class="date-subtitle">Advanced time-blocking, priority matrices, timers, and progress analytics</p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 6px; background: var(--bg-surface); padding: 6px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
                        <i class="fa-regular fa-calendar" style="color: var(--primary);"></i>
                        <input type="date" id="plannerDateFilter" value="${this.selectedDate}" style="background: transparent; border: none; color: var(--text-primary); font-size: 0.85rem; outline: none; cursor: pointer;">
                    </div>
                    <button class="btn btn-secondary" id="manageSlotsBtn" style="padding: 8px 14px; font-size: 0.8rem;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Slots
                    </button>
                    <button class="btn btn-secondary" id="clearCompletedBtn" style="padding: 8px 14px; font-size: 0.8rem; color: var(--danger);">
                        <i class="fa-solid fa-broom"></i> Clear Finished
                    </button>
                    <button class="btn btn-primary" id="openNewTaskModal">
                        <i class="fa-solid fa-plus"></i> New Task
                    </button>
                </div>
            </div>
            <div id="plannerAnalyticsContainer" style="margin-bottom: 20px;"></div>
            <div class="planner-grid" id="plannerGridContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;"></div>
        `;
    }

    bindEvents() {
        const openModalBtn = document.getElementById('openNewTaskModal');
        if (openModalBtn) {
            openModalBtn.addEventListener('click', () => this.openNewTaskModal());
        }

        const manageSlotsBtn = document.getElementById('manageSlotsBtn');
        if (manageSlotsBtn) {
            manageSlotsBtn.addEventListener('click', () => this.openManageSlotsModal());
        }

        const clearCompletedBtn = document.getElementById('clearCompletedBtn');
        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasksForDate());
        }

        const dateFilterInput = document.getElementById('plannerDateFilter');
        if (dateFilterInput) {
            dateFilterInput.addEventListener('change', (e) => {
                this.selectedDate = e.target.value;
                this.renderPlanner();
                this.initSortable();
            });
        }
    }

    initSortable() {
        if (typeof Sortable === 'undefined') return;
        this.timeSlots.forEach(slot => {
            const dropzone = document.querySelector(`.planner-dropzone[data-time="${slot.id}"]`);
            if (dropzone) {
                if (dropzone.__sortableInstance) {
                    dropzone.__sortableInstance.destroy();
                }
                dropzone.__sortableInstance = Sortable.create(dropzone, {
                    group: 'planner-slots',
                    animation: 150,
                    onEnd: (evt) => {
                        const fromSlot = evt.from.getAttribute('data-time');
                        const toSlot = evt.to.getAttribute('data-time');
                        const itemIndex = evt.oldIndex;
                        const newIndex = evt.newIndex;

                        if (fromSlot && toSlot) {
                            if (!this.plannerTasks[fromSlot]) this.plannerTasks[fromSlot] = [];
                            if (!this.plannerTasks[toSlot]) this.plannerTasks[toSlot] = [];

                            const fromDateTasks = this.plannerTasks[fromSlot].filter(t => (t.date || this.selectedDate) === this.selectedDate);
                            const movedItem = fromDateTasks[itemIndex];
                            if (!movedItem) return;

                            const globalFromIdx = this.plannerTasks[fromSlot].findIndex(t => t.id === movedItem.id);
                            if (globalFromIdx > -1) {
                                this.plannerTasks[fromSlot].splice(globalFromIdx, 1);
                            }

                            movedItem.date = this.selectedDate;

                            const targetList = this.plannerTasks[toSlot];
                            const targetDateTasks = targetList.filter(t => (t.date || this.selectedDate) === this.selectedDate);
                            
                            if (targetDateTasks.length === 0 || newIndex >= targetDateTasks.length) {
                                targetList.push(movedItem);
                            } else {
                                const targetAnchor = targetDateTasks[newIndex];
                                const globalTargetIdx = targetList.findIndex(t => t.id === targetAnchor.id);
                                targetList.splice(globalTargetIdx, 0, movedItem);
                            }

                            this.persistState();
                            this.renderPlanner();
                            this.initSortable();
                        }
                    }
                });
            }
        });
    }

    openManageSlotsModal() {
        let slotsHTML = this.timeSlots.map((slot, idx) => `
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px;">
                <input type="text" class="slot-label-input" data-index="${idx}" value="${this.sanitizeHTML(slot.label)}" style="flex: 2; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem;" placeholder="Slot Name">
                <input type="text" class="slot-time-input" data-index="${idx}" value="${this.sanitizeHTML(slot.time)}" style="flex: 1; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem;" placeholder="Time e.g., 09:00 - 10:00">
                <button class="icon-btn remove-slot-btn" data-index="${idx}" style="background: var(--bg-surface); border: 1px solid var(--border-glass); color: var(--danger); width: 36px; height: 36px; border-radius: var(--radius-sm); cursor: pointer;"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `).join('');

        const modalHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <p style="font-size: 0.85rem; color: var(--text-secondary);">Customize your time blocks.</p>
                <div id="slotsEditorList" style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">${slotsHTML}</div>
                <button class="btn btn-secondary" id="addNewSlotRowBtn" style="margin-top: 8px;"><i class="fa-solid fa-plus"></i> Add Custom Slot</button>
                <button class="btn btn-primary" id="saveSlotsBtn" style="margin-top: 16px; width: 100%;"><i class="fa-solid fa-floppy-disk"></i> Save Time Blocks</button>
            </div>
        `;

        window.componentManager = window.componentManager || new ComponentManager();
        componentManager.openModal('Customize Time Slots', modalHTML);

        document.getElementById('addNewSlotRowBtn').addEventListener('click', () => {
            this.timeSlots.push({ id: 'slot_' + Date.now(), label: 'Custom Block', time: 'Custom', icon: 'fa-clock' });
            this.openManageSlotsModal();
        });

        document.querySelectorAll('.remove-slot-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                this.timeSlots.splice(idx, 1);
                this.openManageSlotsModal();
            });
        });

        document.getElementById('saveSlotsBtn').addEventListener('click', () => {
            const labelInputs = document.querySelectorAll('.slot-label-input');
            const timeInputs = document.querySelectorAll('.slot-time-input');

            labelInputs.forEach((input, idx) => {
                if (this.timeSlots[idx]) {
                    this.timeSlots[idx].label = input.value.trim() || 'Custom Block';
                    this.timeSlots[idx].time = timeInputs[idx].value.trim() || '00:00 - 00:00';
                }
            });

            StorageManager.set(this.slotsStorageKey, this.timeSlots);
            window.componentManager.closeModal();
            this.renderPlanner();
            this.initSortable();
            ComponentManager.showToast('Time blocks updated successfully!', 'success');
        });
    }

    openNewTaskModal() {
        const slotOptions = this.timeSlots.map(s => `<option value="${s.id}">${s.label} (${s.time})</option>`).join('');

        const modalHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px; max-height: 75vh; overflow-y: auto; padding-right: 4px;">
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Task Title</label>
                    <input type="text" id="modalTaskTitle" placeholder="e.g., Enterprise Microservice Architecture" autocomplete="off" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                        <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Time Slot</label>
                        <select id="modalTaskTimeSlot" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">${slotOptions}</select>
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                        <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Priority</label>
                        <select id="modalTaskPriority" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                        <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Scheduled Date</label>
                        <input type="date" id="modalTaskDate" value="${this.selectedDate}" style="padding: 11px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                        <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Estimated Duration</label>
                        <input type="text" id="modalTaskDuration" placeholder="e.g., 45 mins" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">
                    </div>
                </div>
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Subtasks (Comma separated)</label>
                    <input type="text" id="modalTaskSubtasks" placeholder="e.g., Setup DB, Write tests" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">
                </div>
                <button class="btn btn-primary" id="modalSaveTaskBtn" style="margin-top: 10px; width: 100%;">
                    <i class="fa-solid fa-plus"></i> Schedule Task
                </button>
            </div>
        `;

        window.componentManager = window.componentManager || new ComponentManager();
        componentManager.openModal('Create Smart Planner Task', modalHTML);

        document.getElementById('modalSaveTaskBtn').addEventListener('click', () => this.handleTaskCreation());
    }

    handleTaskCreation() {
        const titleInput = document.getElementById('modalTaskTitle');
        const timeSlotSelect = document.getElementById('modalTaskTimeSlot');
        const prioritySelect = document.getElementById('modalTaskPriority');
        const dateInput = document.getElementById('modalTaskDate');
        const durationInput = document.getElementById('modalTaskDuration');
        const subtasksInput = document.getElementById('modalTaskSubtasks');

        if (!titleInput || !timeSlotSelect) return;

        const title = titleInput.value.trim();
        const timeSlot = timeSlotSelect.value;
        const priority = prioritySelect ? prioritySelect.value : 'medium';
        const taskDate = dateInput ? dateInput.value : this.selectedDate;
        const duration = durationInput ? durationInput.value.trim() : '30 mins';
        const rawSubtasks = subtasksInput ? subtasksInput.value.trim() : '';

        if (title === '') {
            ComponentManager.showToast('Please provide a valid task title.', 'error');
            return;
        }

        const subtasks = rawSubtasks ? rawSubtasks.split(',').map(st => ({ text: st.trim(), done: false })).filter(st => st.text) : [];

        if (!this.plannerTasks[timeSlot]) this.plannerTasks[timeSlot] = [];

        const newTask = {
            id: 'task_' + Date.now(),
            title,
            completed: false,
            scheduled: true,
            priority,
            duration,
            date: taskDate,
            subtasks,
            createdAt: new Date().toISOString()
        };

        this.plannerTasks[timeSlot].push(newTask);
        this.persistState();
        window.componentManager.closeModal();
        this.renderPlanner();
        this.initSortable();
        ComponentManager.showToast('Task successfully scheduled!', 'success');
    }

    persistState() {
        StorageManager.set(this.storageKey, this.plannerTasks);
    }

    renderAnalytics(allTasksForDate) {
        const container = document.getElementById('plannerAnalyticsContainer');
        if (!container) return;

        let totalTasks = allTasksForDate.length;
        let completedTasks = allTasksForDate.filter(t => t.completed).length;
        let percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        container.innerHTML = `
            <div class="glass-card" style="padding: 14px 20px; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-glass); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-glow); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: bold; font-size: 0.9rem;">
                        ${percent}%
                    </div>
                    <div>
                        <h4 style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">Daily Execution Progress (${this.selectedDate})</h4>
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">${completedTasks} of ${totalTasks} tasks finished successfully</p>
                    </div>
                </div>
                <div style="flex: 1; max-width: 300px; background: var(--bg-main); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-glass);">
                    <div style="width: ${percent}%; background: var(--primary); height: 100%; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    }

    renderPlanner() {
        const gridContainer = document.getElementById('plannerGridContainer');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        let allCurrentDateTasks = [];

        this.timeSlots.forEach(slot => {
            const rawTasks = this.plannerTasks[slot.id] || [];
            const dateFilteredTasks = rawTasks.filter(t => (t.date || this.selectedDate) === this.selectedDate);
            allCurrentDateTasks = allCurrentDateTasks.concat(dateFilteredTasks);

            const column = document.createElement('div');
            column.className = 'glass-card planner-column';
            column.style.cssText = 'display: flex; flex-direction: column; background: var(--bg-surface); border-radius: var(--radius-lg); padding: 16px; border: 1px solid var(--border-glass); min-height: 350px;';

            column.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border-glass); padding-bottom: 10px;">
                    <h3 style="font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid ${slot.icon || 'fa-clock'}" style="color: var(--primary);"></i> 
                        ${this.sanitizeHTML(slot.label)} <small style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(${slot.time})</small>
                    </h3>
                    <span class="badge soft-badge" style="font-size: 0.7rem;">${dateFilteredTasks.length}</span>
                </div>
                <div class="planner-dropzone" data-time="${slot.id}" style="flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 200px;"></div>
            `;

            gridContainer.appendChild(column);

            const dropzone = column.querySelector('.planner-dropzone');

            if (dateFilteredTasks.length > 0) {
                dateFilteredTasks.forEach((task) => {
                    const priorityColor = this.getPriorityColor(task.priority);
                    const globalIdx = rawTasks.findIndex(t => t.id === task.id);
                    
                    const card = document.createElement('div');
                    card.className = 'glass-card task-card-item';
                    card.style.cssText = `padding: 14px; background: var(--bg-main); border-radius: var(--radius-md); border: 1px solid var(--border-glass); border-left: 4px solid ${priorityColor}; cursor: grab; transition: transform var(--transition-fast);`;

                    let subtasksHTML = '';
                    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
                        const subItems = task.subtasks.map((st, stIdx) => `
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; margin-top: 4px;">
                                <input type="checkbox" class="subtask-checkbox" data-slot="${slot.id}" data-globalidx="${globalIdx}" data-subidx="${stIdx}" ${st.done ? 'checked' : ''} style="cursor: pointer;">
                                <span style="${st.done ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${this.sanitizeHTML(st.text)}</span>
                            </label>
                        `).join('');
                        subtasksHTML = `<div style="margin-top: 8px; border-top: 1px dashed var(--border-glass); padding-top: 6px; display: flex; flex-direction: column; gap: 2px;">${subItems}</div>`;
                    }

                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <div style="display: flex; align-items: flex-start; gap: 10px; flex: 1;">
                                <input type="checkbox" class="task-quick-complete" data-slot="${slot.id}" data-globalidx="${globalIdx}" ${task.completed ? 'checked' : ''} style="margin-top: 3px; cursor: pointer; width: 16px; height: 16px;" title="Mark Completed">
                                <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                                    <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary); word-break: break-word; line-height: 1.4; ${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${this.sanitizeHTML(task.title)}</span>
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <span style="font-size: 0.7rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> ${this.sanitizeHTML(task.duration || '30 mins')}</span>
                                        <span class="badge soft-badge" style="font-size: 0.65rem; text-transform: uppercase; background: ${priorityColor}15; color: ${priorityColor};">${task.priority || 'medium'}</span>
                                        <button class="btn-timer-start" data-slot="${slot.id}" data-globalidx="${globalIdx}" style="background: transparent; border: none; color: var(--primary); font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; gap: 4px;" title="Start Pomodoro Timer"><i class="fa-solid fa-stopwatch"></i> Timer</button>
                                    </div>
                                </div>
                            </div>
                            <button class="icon-btn-delete" data-slot="${slot.id}" data-globalidx="${globalIdx}" title="Remove Task" style="background: var(--bg-surface); border: 1px solid var(--border-glass); color: var(--danger); width: 26px; height: 26px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i class="fa-solid fa-xmark" style="font-size: 0.7rem;"></i>
                            </button>
                        </div>
                        ${subtasksHTML}
                    `;

                    card.querySelector('.task-quick-complete').addEventListener('change', (e) => {
                        this.toggleTaskComplete(slot.id, globalIdx, e.target.checked);
                    });

                    card.querySelectorAll('.subtask-checkbox').forEach(chk => {
                        chk.addEventListener('change', (e) => {
                            const sId = e.target.getAttribute('data-slot');
                            const gIdx = parseInt(e.target.getAttribute('data-globalidx'));
                            const stIdx = parseInt(e.target.getAttribute('data-subidx'));
                            this.toggleSubtask(sId, gIdx, stIdx, e.target.checked);
                        });
                    });

                    card.querySelector('.btn-timer-start').addEventListener('click', () => {
                        this.startPomodoroTimer(task.title, task.duration);
                    });

                    card.querySelector('.icon-btn-delete').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.removeTask(slot.id, globalIdx);
                    });

                    dropzone.appendChild(card);
                });
            } else {
                dropzone.innerHTML = `
                    <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); font-size: 0.8rem; border: 1px dashed var(--border-glass); border-radius: var(--radius-md); background: var(--bg-main);">
                        <i class="fa-regular fa-clipboard" style="font-size: 1.4rem; margin-bottom: 6px; display: block; color: var(--text-muted);"></i>
                        No tasks scheduled for this date
                    </div>
                `;
            }
        });

        this.renderAnalytics(allCurrentDateTasks);
    }

    getPriorityColor(priority) {
        switch ((priority || '').toLowerCase()) {
            case 'critical': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'medium': return '#3b82f6';
            case 'low': return '#10b981';
            default: return 'var(--primary)';
        }
    }

    toggleTaskComplete(slot, globalIndex, isCompleted) {
        if (this.plannerTasks[slot] && this.plannerTasks[slot][globalIndex]) {
            this.plannerTasks[slot][globalIndex].completed = isCompleted;
            this.persistState();
            this.renderPlanner();
            this.initSortable();
            ComponentManager.showToast(isCompleted ? 'Task marked as finished!' : 'Task status updated.', 'success');
        }
    }

    toggleSubtask(slot, globalIndex, subtaskIndex, isDone) {
        if (this.plannerTasks[slot] && this.plannerTasks[slot][globalIndex] && this.plannerTasks[slot][globalIndex].subtasks[subtaskIndex]) {
            this.plannerTasks[slot][globalIndex].subtasks[subtaskIndex].done = isDone;
            this.persistState();
            this.renderPlanner();
            this.initSortable();
        }
    }

    startPomodoroTimer(taskTitle, durationStr) {
        let durationMinutes = 25; 
        if (durationStr) {
            const match = durationStr.match(/(\d+)/);
            if (match) durationMinutes = parseInt(match[1]);
        }
        let totalSeconds = durationMinutes * 60;

        const modalHTML = `
            <div style="text-align: center; display: flex; flex-direction: column; gap: 16px; padding: 10px;">
                <h4 style="font-size: 1rem; color: var(--text-primary); font-weight: 600;">${this.sanitizeHTML(taskTitle)}</h4>
                <div id="pomodoroDisplay" style="font-size: 2.8rem; font-weight: 700; color: var(--primary); font-family: monospace;">
                    ${this.formatTime(totalSeconds)}
                </div>
                <div style="display: flex; justify-content: center; gap: 10px;">
                    <button class="btn btn-primary" id="pomodoroToggleBtn" style="padding: 8px 16px; cursor: pointer;">Pause</button>
                    <button class="btn btn-secondary" id="pomodoroCloseBtn" style="padding: 8px 16px; cursor: pointer;">Close</button>
                </div>
            </div>
        `;

        if (typeof ComponentManager !== 'undefined' && typeof ComponentManager.openModal === 'function') {
            ComponentManager.openModal('Pomodoro Execution Timer', modalHTML);
        } else if (window.componentManager && typeof window.componentManager.openModal === 'function') {
            window.componentManager.openModal('Pomodoro Execution Timer', modalHTML);
        } else {
            let existingModal = document.getElementById('fallbackPomodoroModal');
            if (existingModal) existingModal.remove();

            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'fallbackPomodoroModal';
            modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;';
            modalOverlay.innerHTML = `<div style="background: var(--bg-surface, #1e1e1e); padding: 24px; border-radius: 12px; width: 320px; border: 1px solid var(--border-glass, #333);">${modalHTML}</div>`;
            document.body.appendChild(modalOverlay);
        }

        let timerInterval = setInterval(() => {
            totalSeconds--;
            const display = document.getElementById('pomodoroDisplay');
            if (display) {
                display.textContent = this.formatTime(totalSeconds);
            }

            if (totalSeconds <= 0) {
                clearInterval(timerInterval);
                if (typeof ComponentManager !== 'undefined' && ComponentManager.showToast) {
                    ComponentManager.showToast('Pomodoro session completed!', 'success');
                } else {
                    alert('Pomodoro session completed!');
                }
            }
        }, 1000);

        setTimeout(() => {
            const toggleBtn = document.getElementById('pomodoroToggleBtn');
            let isRunning = true;
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    if (isRunning) {
                        clearInterval(timerInterval);
                        toggleBtn.textContent = 'Resume';
                        isRunning = false;
                    } else {
                        timerInterval = setInterval(() => {
                            totalSeconds--;
                            const display = document.getElementById('pomodoroDisplay');
                            if (display) display.textContent = this.formatTime(totalSeconds);
                        }, 1000);
                        toggleBtn.textContent = 'Pause';
                        isRunning = true;
                    }
                });
            }

            const closeBtn = document.getElementById('pomodoroCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    clearInterval(timerInterval);
                    const fallback = document.getElementById('fallbackPomodoroModal');
                    if (fallback) {
                        fallback.remove();
                    } else if (window.componentManager && typeof window.componentManager.closeModal === 'function') {
                        window.componentManager.closeModal();
                    }
                });
            }
        }, 100);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    clearCompletedTasksForDate() {
        let clearedCount = 0;
        Object.keys(this.plannerTasks).forEach(slotId => {
            if (Array.isArray(this.plannerTasks[slotId])) {
                this.plannerTasks[slotId] = this.plannerTasks[slotId].filter(t => {
                    const isForDate = (t.date || this.selectedDate) === this.selectedDate;
                    if (isForDate && t.completed) {
                        clearedCount++;
                        return false;
                    }
                    return true;
                });
            }
        });

        this.persistState();
        this.renderPlanner();
        this.initSortable();
        ComponentManager.showToast(`Cleared ${clearedCount} finished task(s) for ${this.selectedDate}.`, 'info');
    }

    removeTask(slot, globalIndex) {
        if (this.plannerTasks[slot] && this.plannerTasks[slot][globalIndex]) {
            this.plannerTasks[slot].splice(globalIndex, 1);
            this.persistState();
            this.renderPlanner();
            this.initSortable();
            ComponentManager.showToast('Task removed from schedule.', 'info');
        }
    }

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str || '';
        return temp.innerHTML;
    }
}

window.PlannerModule = PlannerModule;
