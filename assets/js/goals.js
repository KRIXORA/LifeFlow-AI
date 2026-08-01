/**
 * @module GoalsModule
 * @description Advanced Long-Term Goals & Milestones Architecture Manager with Dynamic Categories, Drag-and-Drop, Filtering, and Editing
 * @version 2.9.0
 * @author Architect Pro
 */
class GoalsModule {
    constructor() {
        this.storageKey = 'user_goals';
        this.categoriesStorageKey = 'user_goal_categories';

        // Dynamic categories management with default fallback values
        this.categories = StorageManager.get(this.categoriesStorageKey, [
            { id: 'Product', label: 'Product Architecture' },
            { id: 'Design', label: 'UI / UX Design' },
            { id: 'Career', label: 'Career Growth' },
            { id: 'Engineering', label: 'Core Engineering' },
            { id: 'General', label: 'General Milestone' }
        ]);

        this.goals = StorageManager.get(this.storageKey, [
            { id: 'goal_1', title: 'Launch LifeFlow AI v1.0 Public Beta', progress: 85, category: 'Product', dueDate: '2026-08-30' },
            { id: 'goal_2', title: 'Master Advanced CSS Glassmorphism & UI Design', progress: 90, category: 'Design', dueDate: '2026-09-15' },
            { id: 'goal_3', title: 'Build 5 Full-Stack SaaS Portfolio Projects', progress: 60, category: 'Career', dueDate: '2026-10-01' }
        ]);
        
        this.selectedCategoryFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    init() {
        try {
            this.renderGoalsWrapper();
            this.renderGoals();
            this.initSortable();
        } catch (error) {
            console.error('[GoalsModule] Initialization failed:', error);
            ComponentManager.showToast('Failed to initialize Goals matrix.', 'error');
        }
    }

    initSortable() {
        if (typeof Sortable === 'undefined') return;
        const container = document.getElementById('goalsListContainer');
        if (container) {
            Sortable.create(container, {
                animation: 150,
                onEnd: (evt) => {
                    const movedItem = this.goals.splice(evt.oldIndex, 1)[0];
                    this.goals.splice(evt.newIndex, 0, movedItem);
                    this.persistState();
                }
            });
        }
    }

    renderGoalsWrapper() {
        const viewSection = document.getElementById('view-goals');
        if (!viewSection) return;

        const totalGoals = this.goals.length;
        const avgProgress = totalGoals > 0 
            ? Math.round(this.goals.reduce((acc, curr) => acc + curr.progress, 0) / totalGoals) 
            : 0;

        viewSection.innerHTML = `
            <div class="glass-card" style="display: flex; flex-direction: column; gap: 24px;">
                <div class="view-header-actions" style="margin-bottom: 0; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: center;">
                    <div>
                        <h2>Long-Term Goals & Milestones</h2>
                        <p class="date-subtitle">Track, scale, and achieve your professional execution metrics</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <!-- Search Bar -->
                        <div style="position: relative; display: flex; align-items: center;">
                            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; color: var(--text-secondary); font-size: 0.8rem;"></i>
                            <input type="text" id="goalSearchInput" placeholder="Search goals..." value="${this.sanitizeHTML(this.searchQuery)}" style="padding: 6px 10px 6px 30px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem; width: 150px;" />
                        </div>

                        <!-- Category Filter -->
                        <select id="goalCategoryFilter" class="form-control" style="padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem;" title="Filter by Category">
                            <option value="all">All Categories</option>
                            ${this.categories.map(cat => `<option value="${cat.id}" ${this.selectedCategoryFilter === cat.id ? 'selected' : ''}>${cat.label}</option>`).join('')}
                        </select>

                        <!-- Manage Categories Button -->
                        <button class="btn btn-secondary" id="manageCategoriesBtn" title="Manage Custom Categories" style="padding: 6px 10px; font-size: 0.85rem;">
                            <i class="fa-solid fa-tags"></i> Categories
                        </button>

                        <span class="badge soft-badge"><i class="fa-solid fa-chart-line"></i> Avg: ${avgProgress}%</span>
                        <button class="btn btn-primary" id="addNewGoalBtn">
                            <i class="fa-solid fa-plus"></i> Add Goal
                        </button>
                    </div>
                </div>
                <div id="goalsListContainer" style="display: flex; flex-direction: column; gap: 16px;"></div>
            </div>
        `;

        document.getElementById('addNewGoalBtn')?.addEventListener('click', () => this.openGoalModal());
        document.getElementById('manageCategoriesBtn')?.addEventListener('click', () => this.openCategoryManagerModal());

        document.getElementById('goalSearchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.renderGoals();
        });

        document.getElementById('goalCategoryFilter')?.addEventListener('change', (e) => {
            this.selectedCategoryFilter = e.target.value;
            this.renderGoals();
        });
    }

    renderGoals() {
        const container = document.getElementById('goalsListContainer');
        if (!container) return;

        container.innerHTML = '';

        let filteredGoals = this.goals.filter(goal => {
            const matchesCat = this.selectedCategoryFilter === 'all' || goal.category === this.selectedCategoryFilter;
            const matchesSearch = !this.searchQuery || goal.title.toLowerCase().includes(this.searchQuery);
            return matchesCat && matchesSearch;
        });

        if (Array.isArray(filteredGoals) && filteredGoals.length > 0) {
            filteredGoals.forEach((goal) => {
                const originalIndex = this.goals.findIndex(g => g.id === goal.id);
                const categoryObj = this.categories.find(c => c.id === goal.category) || { label: goal.category };

                const card = document.createElement('div');
                card.className = 'glass-card';
                card.style.cssText = 'display: flex; flex-direction: column; gap: 14px; background: var(--bg-main); border-radius: var(--radius-md); padding: 20px; cursor: grab; transition: transform var(--transition-fast), border-color var(--transition-fast);';
                
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <h3 style="font-size: 1.05rem; font-weight: 600; color: var(--text-primary); word-break: break-word;">${this.sanitizeHTML(goal.title)}</h3>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            ${goal.dueDate ? `<span class="badge soft-badge" style="font-size: 0.7rem;"><i class="fa-regular fa-calendar"></i> ${goal.dueDate}</span>` : ''}
                            <span class="badge soft-badge">${this.sanitizeHTML(categoryObj.label)}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="flex: 1; background: var(--bg-surface); height: 8px; border-radius: 9999px; overflow: hidden; border: 1px solid var(--border-glass);">
                            <div style="width: ${goal.progress}%; background: var(--primary); height: 100%; border-radius: 9999px; transition: width var(--transition-normal);"></div>
                        </div>
                        <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); min-width: 38px; text-align: right;">${goal.progress}%</span>
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; margin-top: 4px;">
                        <button class="btn btn-secondary btn-increment" data-index="${originalIndex}" style="padding: 6px 12px; font-size: 0.75rem;">
                            <i class="fa-solid fa-arrow-up"></i> +10%
                        </button>
                        <button class="btn btn-secondary btn-edit" data-index="${originalIndex}" title="Edit Milestone" style="padding: 6px 10px; font-size: 0.75rem;">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="icon-btn btn-delete" data-index="${originalIndex}" title="Remove Milestone" style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--bg-surface); border: 1px solid var(--border-glass); color: var(--danger); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition-fast);">
                            <i class="fa-solid fa-trash-can" style="font-size: 0.75rem;"></i>
                        </button>
                    </div>
                `;

                card.querySelector('.btn-increment').addEventListener('click', () => this.updateProgress(originalIndex, 10));
                card.querySelector('.btn-edit').addEventListener('click', () => this.openGoalModal(originalIndex));
                card.querySelector('.btn-delete').addEventListener('click', () => this.deleteGoal(originalIndex));

                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-glass); border-radius: var(--radius-md); background: var(--bg-main);">
                    <i class="fa-regular fa-bullseye" style="font-size: 1.8rem; margin-bottom: 8px; display: block; color: var(--text-muted);"></i>
                    No long-term milestones recorded or matching filters. Initialize a new goal to begin execution tracking.
                </div>
            `;
        }
    }

    /**
     * Opens Modal to create or delete custom user categories
     */
    openCategoryManagerModal() {
        const renderCategoryListHTML = () => {
            return this.categories.map(cat => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-glass);">
                    <span style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500;">${this.sanitizeHTML(cat.label)} <small style="color: var(--text-secondary);">(${cat.id})</small></span>
                    <button class="btn btn-secondary delete-cat-btn" data-id="${cat.id}" style="padding: 4px 8px; color: var(--danger); border-color: var(--danger); font-size: 0.75rem;" title="Delete Category"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `).join('');
        };

        const modalHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Existing Categories</label>
                    <div id="customCategoriesListContainer" style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto;">
                        ${renderCategoryListHTML()}
                    </div>
                </div>

                <div style="border-top: 1px solid var(--border-glass); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <label for="newCategoryInput" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Add Custom Category</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="newCategoryInput" placeholder="e.g., Financial, Fitness..." autocomplete="off" style="flex: 1; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem;">
                        <button class="btn btn-primary" id="saveNewCategoryBtn" style="padding: 10px 16px;"><i class="fa-solid fa-plus"></i> Add</button>
                    </div>
                </div>
            </div>
        `;

        window.componentManager = window.componentManager || new ComponentManager();
        componentManager.openModal('Manage Goal Categories', modalHTML);

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
                    
                    // Re-render modal container list
                    const container = document.getElementById('customCategoriesListContainer');
                    if (container) container.innerHTML = renderCategoryListHTML();
                    bindCatActions();
                    this.renderGoalsWrapper();
                    this.renderGoals();
                    ComponentManager.showToast('Category removed successfully.', 'info');
                };
            });
        };
        bindCatActions();

        const handleAddCat = () => {
            const input = document.getElementById('newCategoryInput');
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
            const container = document.getElementById('customCategoriesListContainer');
            if (container) container.innerHTML = renderCategoryListHTML();
            bindCatActions();
            this.renderGoalsWrapper();
            this.renderGoals();
            ComponentManager.showToast('Custom category created successfully!', 'success');
        };

        document.getElementById('saveNewCategoryBtn')?.addEventListener('click', handleAddCat);
        document.getElementById('newCategoryInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddCat();
        });
    }

    openGoalModal(editIndex = null) {
        const isEditing = editIndex !== null;
        const targetGoal = isEditing ? this.goals[editIndex] : { title: '', category: this.categories[0]?.id || 'General', progress: 0, dueDate: '' };

        const modalHTML = `
            <div class="form-group" style="display: flex; flex-direction: column; gap: 8px;">
                <label for="modalGoalTitle" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Goal Objective</label>
                <input type="text" id="modalGoalTitle" value="${this.sanitizeHTML(targetGoal.title)}" placeholder="e.g., Deploy Enterprise Microservices Architecture" autocomplete="off" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                <label for="modalGoalCategory" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Category Tier</label>
                <select id="modalGoalCategory" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">
                    ${this.categories.map(cat => `<option value="${cat.id}" ${targetGoal.category === cat.id ? 'selected' : ''}>${cat.label}</option>`).join('')}
                </select>
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                <label for="modalGoalDueDate" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Target Due Date</label>
                <input type="date" id="modalGoalDueDate" value="${targetGoal.dueDate || ''}" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">
            </div>
            ${isEditing ? `
                <div class="form-group" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                    <label for="modalGoalProgress" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Progress Percentage (%)</label>
                    <input type="number" id="modalGoalProgress" min="0" max="100" value="${targetGoal.progress}" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.9rem;">
                </div>
            ` : ''}
            <button class="btn btn-primary" id="modalSaveGoalBtn" style="margin-top: 20px; width: 100%;">
                <i class="fa-solid ${isEditing ? 'fa-floppy-disk' : 'fa-plus'}"></i> ${isEditing ? 'Update Milestone' : 'Establish Milestone'}
            </button>
        `;

        window.componentManager = window.componentManager || new ComponentManager();
        componentManager.openModal(isEditing ? 'Edit Milestone Matrix' : 'Architect New Milestone', modalHTML);

        const titleInput = document.getElementById('modalGoalTitle');
        if (titleInput) {
            titleInput.focus();
            titleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleGoalSave(editIndex);
            });
        }

        document.getElementById('modalSaveGoalBtn')?.addEventListener('click', () => this.handleGoalSave(editIndex));
    }

    handleGoalSave(editIndex) {
        const titleInput = document.getElementById('modalGoalTitle');
        const categorySelect = document.getElementById('modalGoalCategory');
        const dueDateInput = document.getElementById('modalGoalDueDate');
        const progressInput = document.getElementById('modalGoalProgress');

        if (!titleInput || !categorySelect) return;

        const trimmedTitle = titleInput.value.trim();
        const category = categorySelect.value;
        const dueDate = dueDateInput ? dueDateInput.value : '';

        if (trimmedTitle === '') {
            ComponentManager.showToast('Please specify a valid goal objective.', 'error');
            titleInput.focus();
            return;
        }

        if (editIndex !== null && this.goals[editIndex]) {
            this.goals[editIndex].title = trimmedTitle;
            this.goals[editIndex].category = category;
            this.goals[editIndex].dueDate = dueDate;
            if (progressInput) {
                this.goals[editIndex].progress = Math.min(100, Math.max(0, parseInt(progressInput.value) || 0));
            }
            ComponentManager.showToast('Milestone successfully updated!', 'success');
        } else {
            const newGoal = {
                id: 'goal_' + Date.now(),
                title: trimmedTitle,
                progress: 0,
                category,
                dueDate
            };
            this.goals.push(newGoal);
            ComponentManager.showToast('New milestone successfully registered!', 'success');
        }

        this.persistState();
        window.componentManager.closeModal();
        this.renderGoalsWrapper();
        this.renderGoals();
        this.initSortable();
    }

    updateProgress(index, amount) {
        if (this.goals[index]) {
            const currentProgress = this.goals[index].progress;
            if (currentProgress >= 100) {
                ComponentManager.showToast('Milestone is already at 100% completion capacity.', 'info');
                return;
            }
            this.goals[index].progress = Math.min(100, currentProgress + amount);
            this.persistState();
            this.renderGoalsWrapper();
            this.renderGoals();
            this.initSortable();
            ComponentManager.showToast('Milestone telemetry progress updated!', 'success');
        }
    }

    deleteGoal(index) {
        if (this.goals[index]) {
            this.goals.splice(index, 1);
            this.persistState();
            this.renderGoalsWrapper();
            this.renderGoals();
            this.initSortable();
            ComponentManager.showToast('Milestone archived/removed.', 'info');
        }
    }

    persistState() {
        StorageManager.set(this.storageKey, this.goals);
    }

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
}

window.GoalsModule = GoalsModule;
