/**
 * @module HabitsModule
 * @description Habit Tracker with Custom Categories & Streak Tracking
 * @version 2.9.1
 */
class HabitsModule {
    constructor() {
        this.storageKey = 'user_habits';
        this.categoriesStorageKey = 'user_habit_categories';

        // Dynamic categories management
        this.categories = StorageManager.get(this.categoriesStorageKey, [
            { id: 'Wellness', label: 'Health & Wellness' },
            { id: 'Productivity', label: 'Productivity' },
            { id: 'Learning', label: 'Learning' },
            { id: 'Mindfulness', label: 'Mindfulness' }
        ]);

        this.habits = StorageManager.get(this.storageKey, [
            { id: 'habit_1', name: 'Read for 20 minutes', streak: 14, completedToday: true, category: 'Learning' },
            { id: 'habit_2', name: 'Morning stretch & walk', streak: 5, completedToday: false, category: 'Wellness' },
            { id: 'habit_3', name: 'Drink 8 glasses of water', streak: 21, completedToday: true, category: 'Wellness' }
        ]);

        this.selectedCategoryFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    /**
     * Initializes components, wrappers, and event listeners safely
     */
    init() {
        try {
            this.renderHabits();
            this.renderDashboardWidget();
        } catch (error) {
            console.error('[HabitsModule] Initialization failed:', error);
            ComponentManager.showToast('Failed to load Habits.', 'error');
        }
    }

    /**
     * Renders the dynamic habits layout, header actions, completion metrics, and item cards
     */
    renderHabits() {
        const viewSection = document.getElementById('view-habits');
        if (!viewSection) return;

        const totalHabits = this.habits.length;
        const completedCount = this.habits.filter(h => h.completedToday).length;
        const completionRate = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

        viewSection.innerHTML = `
            <div class="glass-card" style="display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 100%; box-sizing: border-box; overflow-x: hidden; padding: clamp(15px, 4vw, 25px);">
                <div class="view-header-actions" style="margin-bottom: 0; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="min-width: 180px; flex: 1;">
                        <h2 style="font-size: clamp(1.1rem, 2.5vw, 1.4rem); font-weight: 700; word-break: break-word;">Habit Tracker</h2>
                        <p class="date-subtitle" style="font-size: clamp(0.75rem, 1.5vw, 0.85rem);">Monitor daily consistency and track execution streaks</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; width: 100%;">
                        <!-- Search Bar -->
                        <div style="position: relative; display: flex; align-items: center; flex: 1; min-width: 140px;">
                            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; color: var(--text-secondary); font-size: 0.8rem;"></i>
                            <input type="text" id="habitSearchInput" placeholder="Search habits..." value="${this.sanitizeHTML(this.searchQuery)}" style="padding: 8px 10px 8px 30px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem; width: 100%; box-sizing: border-box;" />
                        </div>

                        <!-- Category Filter -->
                        <select id="habitCategoryFilter" class="form-control" style="padding: 8px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem; flex: 1; min-width: 140px;" title="Filter by Category">
                            <option value="all">All Categories</option>
                            ${this.categories.map(cat => `<option value="${cat.id}" ${this.selectedCategoryFilter === cat.id ? 'selected' : ''}>${cat.label}</option>`).join('')}
                        </select>

                        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-left: auto;">
                            <!-- Manage Categories Button -->
                            <button class="btn btn-secondary" id="manageHabitCategoriesBtn" title="Manage Custom Categories" style="padding: 8px 12px; font-size: 0.85rem;">
                                <i class="fa-solid fa-tags"></i> Categories
                            </button>

                            <span class="badge soft-badge" style="font-size: clamp(0.7rem, 1.2vw, 0.8rem);"><i class="fa-solid fa-chart-pie"></i> Today: ${completionRate}%</span>
                            <button class="btn btn-primary" id="addNewHabitBtn" style="padding: 8px 16px; font-size: 0.85rem;">
                                <i class="fa-solid fa-plus"></i> Add Habit
                            </button>
                        </div>
                    </div>
                </div>
                <div id="habitsListContainer" style="display: flex; flex-direction: column; gap: 16px; width: 100%; box-sizing: border-box;"></div>
            </div>
        `;

        document.getElementById('addNewHabitBtn')?.addEventListener('click', () => this.openHabitModal());
        document.getElementById('manageHabitCategoriesBtn')?.addEventListener('click', () => this.openCategoryManagerModal());

        document.getElementById('habitSearchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.renderHabitsListContent();
        });

        document.getElementById('habitCategoryFilter')?.addEventListener('change', (e) => {
            this.selectedCategoryFilter = e.target.value;
            this.renderHabitsListContent();
        });

        this.renderHabitsListContent();
    }

    /**
     * Renders filtered list of habits inside container
     */
    renderHabitsListContent() {
        const container = document.getElementById('habitsListContainer');
        if (!container) return;

        container.innerHTML = '';

        let filteredHabits = this.habits.filter(habit => {
            const matchesCat = this.selectedCategoryFilter === 'all' || habit.category === this.selectedCategoryFilter;
            const matchesSearch = !this.searchQuery || habit.name.toLowerCase().includes(this.searchQuery);
            return matchesCat && matchesSearch;
        });

        if (Array.isArray(filteredHabits) && filteredHabits.length > 0) {
            filteredHabits.forEach((habit) => {
                const originalIndex = this.habits.findIndex(h => h.id === habit.id);
                const categoryObj = this.categories.find(c => c.id === habit.category) || { label: habit.category || 'General' };

                const card = document.createElement('div');
                card.className = 'glass-card';
                card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); border-radius: var(--radius-md); padding: clamp(12px, 3vw, 18px); transition: transform var(--transition-fast), border-color var(--transition-fast); gap: 12px; flex-wrap: wrap; width: 100%; box-sizing: border-box;';
                
                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 200px;">
                        <div style="background: ${habit.completedToday ? 'rgba(16, 185, 129, 0.1)' : 'var(--primary-light)'}; color: ${habit.completedToday ? 'var(--success)' : 'var(--primary)'}; width: 42px; height: 42px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; transition: background var(--transition-fast), color var(--transition-fast);">
                            <i class="fa-solid ${habit.completedToday ? 'fa-fire-flame-curved' : 'fa-fire'}"></i>
                        </div>
                        <div style="min-width: 0; flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <h4 style="font-size: clamp(0.9rem, 2vw, 1rem); font-weight: 600; color: var(--text-primary); word-break: break-word; margin: 0;">${this.sanitizeHTML(habit.name)}</h4>
                                <span class="badge soft-badge" style="font-size: 0.65rem;">${this.sanitizeHTML(categoryObj.label)}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px; flex-wrap: wrap;">
                                <span style="font-size: 0.8rem; color: var(--success); font-weight: 600;"><i class="fa-solid fa-bolt"></i> ${habit.streak} Day Streak</span>
                                <span style="font-size: 0.75rem; color: var(--text-secondary);">${habit.completedToday ? 'Done for today' : 'Not done yet'}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-left: auto;">
                        <button class="btn ${habit.completedToday ? 'btn-primary' : 'btn-secondary'} btn-toggle-habit" data-index="${originalIndex}" style="padding: 8px 14px; font-size: 0.8rem; flex-shrink: 0;">
                            <i class="fa-solid ${habit.completedToday ? 'fa-check' : 'fa-circle'}"></i> ${habit.completedToday ? 'Completed' : 'Mark Done'}
                        </button>
                        <button class="btn btn-secondary btn-edit-habit" data-index="${originalIndex}" title="Edit Habit" style="padding: 8px 10px; font-size: 0.8rem; flex-shrink: 0;">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="icon-btn btn-delete-habit" data-index="${originalIndex}" title="Remove Habit" style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--bg-surface); border: 1px solid var(--border-glass); color: var(--danger); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: var(--transition-fast);">
                            <i class="fa-solid fa-trash-can" style="font-size: 0.8rem;"></i>
                        </button>
                    </div>
                `;

                card.querySelector('.btn-toggle-habit').addEventListener('click', () => this.toggleHabit(originalIndex));
                card.querySelector('.btn-edit-habit').addEventListener('click', () => this.openHabitModal(originalIndex));
                card.querySelector('.btn-delete-habit').addEventListener('click', () => this.deleteHabit(originalIndex));
                container.appendChild(card);
            });
        } else {
            const hasAnyHabits = this.habits.length > 0;
            container.innerHTML = `
                <div style="text-align: center; padding: 36px 15px; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-glass); border-radius: var(--radius-md); background: var(--bg-main); box-sizing: border-box;">
                    <i class="fa-regular fa-fire" style="font-size: 1.8rem; margin-bottom: 8px; display: block; color: var(--text-muted);"></i>
                    ${hasAnyHabits ? 'No habits match your filter or search.' : 'No habits yet. Click "Add Habit" to start building one.'}
                </div>
            `;
        }
    }

    /**
     * Renders habits mini-list on the main Dashboard widget dynamically
     */
    renderDashboardWidget() {
        const dashboardList = document.getElementById('dashboardHabitsList');
        if (!dashboardList) return;

        dashboardList.innerHTML = '';

        if (Array.isArray(this.habits) && this.habits.length > 0) {
            this.habits.slice(0, 3).forEach((habit) => {
                const originalIndex = this.habits.findIndex(h => h.id === habit.id);
                const row = document.createElement('div');
                row.className = 'habit-row';
                row.innerHTML = `
                    <div class="habit-info" style="min-width: 0; overflow: hidden; text-overflow: ellipsis;">
                        <i class="fa-solid ${habit.completedToday ? 'fa-fire-flame-curved' : 'fa-fire'}"></i>
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.sanitizeHTML(habit.name)}</span>
                    </div>
                    <button class="habit-check-btn ${habit.completedToday ? 'completed' : ''}" data-index="${originalIndex}" title="Toggle Habit" style="flex-shrink: 0;">
                        <i class="fa-solid fa-check"></i>
                    </button>
                `;

                row.querySelector('.habit-check-btn').addEventListener('click', () => this.toggleHabit(originalIndex));
                dashboardList.appendChild(row);
            });
        } else {
            dashboardList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">No habits available</div>`;
        }
    }

    /**
     * Opens Modal to create or delete custom habit categories
     */
    openCategoryManagerModal() {
        const renderCategoryListHTML = () => {
            return this.categories.map(cat => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); gap: 10px;">
                    <span style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500; word-break: break-word;">${this.sanitizeHTML(cat.label)} <small style="color: var(--text-secondary);">(${cat.id})</small></span>
                    <button class="btn btn-secondary delete-cat-btn" data-id="${cat.id}" style="padding: 4px 8px; color: var(--danger); border-color: var(--danger); font-size: 0.75rem; flex-shrink: 0;" title="Delete Category"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `).join('');
        };

        const modalHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px; width: 100%; box-sizing: border-box;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Existing Habit Categories</label>
                    <div id="habitCategoriesListContainer" style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto;">
                        ${renderCategoryListHTML()}
                    </div>
                </div>

                <div style="border-top: 1px solid var(--border-glass); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <label for="newHabitCategoryInput" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Add Custom Category</label>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <input type="text" id="newHabitCategoryInput" placeholder="e.g., Fitness, Mindfulness..." autocomplete="off" style="flex: 1; min-width: 150px; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem; box-sizing: border-box;">
                        <button class="btn btn-primary" id="saveNewHabitCategoryBtn" style="padding: 10px 16px; flex-shrink: 0;"><i class="fa-solid fa-plus"></i> Add</button>
                    </div>
                </div>
            </div>
        `;

        window.componentManager = window.componentManager || new ComponentManager();
        componentManager.openModal('Manage Habit Categories', modalHTML);

        const bindCatActions = () => {
            document.querySelectorAll('.delete-cat-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const catId = e.currentTarget.getAttribute('data-id');
                    if (this.categories.length <= 1) {
                        ComponentManager.showToast('You must retain at least one category.', 'error');
                        return;
                    }
                    this.categories = this.categories.filter(c => c.id !== catId);
                    StorageManager.set(this.categoriesStorageKey, this.categories);
                    
                    const container = document.getElementById('habitCategoriesListContainer');
                    if (container) container.innerHTML = renderCategoryListHTML();
                    bindCatActions();
                    this.renderHabits();
                    ComponentManager.showToast('Category removed successfully.', 'info');
                };
            });
        };
        bindCatActions();

        const handleAddCat = () => {
            const input = document.getElementById('newHabitCategoryInput');
            if (!input) return;
            const val = input.value.trim();
            if (val === '') return;

            const categoryId = val.replace(/\s+/g, '_').toLowerCase();
            if (this.categories.some(c => c.id === categoryId)) {
                ComponentManager.showToast('Category already exists!', 'error');
                return;
            }

            this.categories.push({ id: categoryId, label: val });
            StorageManager.set(this.categoriesStorageKey, this.categories);
            
            input.value = '';
            const container = document.getElementById('habitCategoriesListContainer');
            if (container) container.innerHTML = renderCategoryListHTML();
            bindCatActions();
            this.renderHabits();
            ComponentManager.showToast('Custom category created successfully!', 'success');
        };

        document.getElementById('saveNewHabitCategoryBtn')?.addEventListener('click', handleAddCat);
        document.getElementById('newHabitCategoryInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddCat();
        });
    }

    /**
     * Opens the modal dialog for creating or editing a habit
     */
    openHabitModal(editIndex = null) {
        const isEditing = editIndex !== null;
        const targetHabit = isEditing ? this.habits[editIndex] : { name: '', category: this.categories[0]?.id || 'Wellness', streak: 1, completedToday: false };

        const modalHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px; width: 100%; box-sizing: border-box;">
                <div class="form-group" style="display: flex; flex-direction: column; gap: 8px;">
                    <label for="modalHabitName" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Habit Name</label>
                    <input type="text" id="modalHabitName" value="${this.sanitizeHTML(targetHabit.name)}" placeholder="e.g., Drink 8 glasses of water" autocomplete="off" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); width: 100%; box-sizing: border-box;">
                </div>
                <div class="form-group" style="display: flex; flex-direction: column; gap: 8px;">
                    <label for="modalHabitCategory" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Category</label>
                    <select id="modalHabitCategory" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); width: 100%; box-sizing: border-box;">
                        ${this.categories.map(cat => `<option value="${cat.id}" ${targetHabit.category === cat.id ? 'selected' : ''}>${cat.label}</option>`).join('')}
                    </select>
                </div>
                ${isEditing ? `
                    <div class="form-group" style="display: flex; flex-direction: column; gap: 8px;">
                        <label for="modalHabitStreak" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Streak Count (Days)</label>
                        <input type="number" id="modalHabitStreak" min="0" value="${targetHabit.streak}" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); width: 100%; box-sizing: border-box;">
                    </div>
                ` : ''}
                <button class="btn btn-primary" id="modalSaveHabitBtn" style="margin-top: 6px; width: 100%; box-sizing: border-box;">
                    <i class="fa-solid ${isEditing ? 'fa-floppy-disk' : 'fa-plus'}"></i> ${isEditing ? 'Update Habit' : 'Add Habit'}
                </button>
            </div>
        `;

        window.componentManager = window.componentManager || new ComponentManager();
        componentManager.openModal(isEditing ? 'Edit Habit' : 'Add New Habit', modalHTML);

        const nameInput = document.getElementById('modalHabitName');
        if (nameInput) {
            nameInput.focus();
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleHabitSave(editIndex);
            });
        }

        document.getElementById('modalSaveHabitBtn')?.addEventListener('click', () => this.handleHabitSave(editIndex));
    }

    /**
     * Handles creation and updating of habits safely
     */
    handleHabitSave(editIndex) {
        const nameInput = document.getElementById('modalHabitName');
        const categorySelect = document.getElementById('modalHabitCategory');
        const streakInput = document.getElementById('modalHabitStreak');
        if (!nameInput) return;

        const rawName = nameInput.value;
        const trimmedName = rawName.trim();
        const category = categorySelect ? categorySelect.value : 'General';

        if (trimmedName === '') {
            ComponentManager.showToast('Please provide a valid habit title.', 'error');
            nameInput.focus();
            return;
        }

        const safeTextPattern = /^[a-zA-Z0-9\s\-_.,!?()@#]+$/;
        if (!safeTextPattern.test(trimmedName)) {
            ComponentManager.showToast('Habit title contains restricted special characters.', 'error');
            nameInput.focus();
            return;
        }

        if (editIndex !== null && this.habits[editIndex]) {
            this.habits[editIndex].name = trimmedName;
            this.habits[editIndex].category = category;
            if (streakInput) {
                this.habits[editIndex].streak = Math.max(0, parseInt(streakInput.value) || 0);
            }
            ComponentManager.showToast('Habit successfully updated!', 'success');
        } else {
            const newHabit = {
                id: 'habit_' + Date.now(),
                name: trimmedName,
                category,
                streak: 1,
                completedToday: false
            };
            this.habits.push(newHabit);
            ComponentManager.showToast('Habit added!', 'success');
        }

        this.persistState();
        window.componentManager.closeModal();
        this.renderHabits();
        this.renderDashboardWidget();
    }

    toggleHabit(index) {
        if (!this.habits[index]) return;

        this.habits[index].completedToday = !this.habits[index].completedToday;
        if (this.habits[index].completedToday) {
            this.habits[index].streak += 1;
            ComponentManager.showToast('Habit completed for today! Streak increased.', 'success');
            if (typeof ComponentManager.addNotification === 'function') {
                ComponentManager.addNotification('Habit streak up!', `"${this.habits[index].name}" — ${this.habits[index].streak} day streak.`);
            }
        } else {
            this.habits[index].streak = Math.max(0, this.habits[index].streak - 1);
            ComponentManager.showToast('Habit status reverted.', 'info');
        }

        this.persistState();
        this.renderHabits();
        this.renderDashboardWidget();
    }

    deleteHabit(index) {
        if (this.habits[index]) {
            const [removedHabit] = this.habits.splice(index, 1);
            this.persistState();
            this.renderHabits();
            this.renderDashboardWidget();
            ComponentManager.showUndoToast(`"${removedHabit.name}" deleted.`, () => {
                this.habits.splice(index, 0, removedHabit);
                this.persistState();
                this.renderHabits();
                this.renderDashboardWidget();
                ComponentManager.showToast('Habit restored.', 'success');
            });
        }
    }

    persistState() {
        StorageManager.set(this.storageKey, this.habits);
    }

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
}

window.HabitsModule = HabitsModule;
