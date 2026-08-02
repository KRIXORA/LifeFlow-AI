/**
 * @module CalendarModule
 * @description Advanced Interactive Dynamic Monthly Matrix & Event Architecture Manager
 * @version 2.8.0
 */
class CalendarModule {
    constructor() {
        this.storageKey = 'calendar_events';
        
        // Use live system date instead of hardcoded June
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth(); // 0-indexed: 0 = Jan, 6 = July, etc.
        
        // State management
        this.selectedDateStr = null;
        this.viewMode = 'grid'; // 'grid' or 'agenda'
        this.searchQuery = '';  // Global or filtered search keyword

        // Predefined category color mappings
        this.categories = {
            work: { label: 'Work', color: '#6366f1' },       // Indigo / Primary
            personal: { label: 'Personal', color: '#10b981' }, // Emerald
            urgent: { label: 'Urgent', color: '#ef4444' },     // Red / Danger
            meeting: { label: 'Meeting', color: '#3b82f6' },   // Blue
            default: { label: 'General', color: '#8b5cf6' }    // Purple
        };

        // Persistent storage fallback initialization — starts empty for new users
        // (previously seeded with dummy dev-sounding events like "Architecture Review").
        const rawStored = StorageManager.get(this.storageKey, {});

        // Normalize stored data
        this.events = {};
        for (const [dateStr, val] of Object.entries(rawStored)) {
            if (Array.isArray(val)) {
                this.events[dateStr] = val.map(evt => ({
                    ...evt,
                    category: evt.category && this.categories[evt.category] ? evt.category : 'default'
                }));
            } else if (typeof val === 'string' && val.trim() !== '') {
                this.events[dateStr] = [{ id: 'legacy_' + Math.random().toString(36).substr(2, 9), title: val, time: '', category: 'default' }];
            }
        }

        this.init();
    }

    /**
     * Initializes calendar components, control bindings, and storage sync listeners
     */
    init() {
        try {
            this.renderCalendarWrapper();
            this.renderMainContent();
            this.bindStorageListener();
        } catch (error) {
            console.error('[CalendarModule] Initialization failed:', error);
            ComponentManager.showToast('Failed to initialize Calendar matrix.', 'error');
        }
    }

    /**
     * Binds multi-tab localStorage synchronization listener
     */
    bindStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    this.events = {};
                    for (const [dateStr, val] of Object.entries(parsed)) {
                        if (Array.isArray(val)) {
                            this.events[dateStr] = val;
                        } else if (typeof val === 'string' && val.trim() !== '') {
                            this.events[dateStr] = [{ id: 'legacy_' + Math.random().toString(36).substr(2, 9), title: val, time: '', category: 'default' }];
                        }
                    }
                    this.renderMainContent();
                } catch (err) {
                    console.error('[CalendarModule] Failed to parse cross-tab storage update:', err);
                }
            }
        });
    }

    /**
     * Renders structural layout headers, navigation controls, search bar, and view toggle containers inside view-calendar
     */
    renderCalendarWrapper() {
        const viewSection = document.getElementById('view-calendar');
        if (!viewSection) return;

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        viewSection.innerHTML = `
            <div class="glass-card" style="display: flex; flex-direction: column; gap: 16px;">
                <div class="view-header-actions" style="margin-bottom: 0; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center;">
                    <div>
                        <h2>Calendar & Schedule Matrix</h2>
                        <p class="date-subtitle">Interactive monthly telemetry, categories, and milestone tracker</p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <!-- Search Bar -->
                        <div style="position: relative; display: flex; align-items: center;">
                            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; color: var(--text-secondary); font-size: 0.8rem;"></i>
                            <input type="text" id="calSearchInput" placeholder="Search events..." value="${this.sanitizeHTML(this.searchQuery)}" style="padding: 6px 10px 6px 30px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem; width: 160px;" />
                        </div>

                        <!-- View Toggle Switch -->
                        <div style="display: flex; background: var(--bg-main); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 2px;">
                            <button class="btn ${this.viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}" id="calViewGridBtn" title="Matrix Grid View" style="padding: 4px 8px; font-size: 0.8rem;"><i class="fa-solid fa-table-cells"></i></button>
                            <button class="btn ${this.viewMode === 'agenda' ? 'btn-primary' : 'btn-secondary'}" id="calViewAgendaBtn" title="Agenda List View" style="padding: 4px 8px; font-size: 0.8rem;"><i class="fa-solid fa-list-check"></i></button>
                        </div>

                        <!-- Export / Import Actions -->
                        <div style="display: flex; gap: 4px;">
                            <button class="btn btn-secondary" id="calExportBtn" title="Export JSON / ICS Backup" style="padding: 6px 10px;"><i class="fa-solid fa-download"></i></button>
                            <label class="btn btn-secondary" title="Import Calendar JSON" style="padding: 6px 10px; cursor: pointer; margin-bottom: 0;">
                                <i class="fa-solid fa-upload"></i>
                                <input type="file" id="calImportFile" accept=".json" style="display: none;" />
                            </label>
                        </div>

                        <div style="display: flex; gap: 4px; align-items: center;">
                            <button class="btn btn-secondary" id="calPrevBtn" title="Previous Month" style="padding: 6px 10px;"><i class="fa-solid fa-chevron-left"></i></button>
                            <button class="btn btn-secondary" id="calTodayBtn" title="Jump to Today" style="padding: 6px 10px; font-size: 0.8rem;">Today</button>
                            <button class="btn btn-secondary" id="calNextBtn" title="Next Month" style="padding: 6px 10px;"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                        <select id="calQuickJumpSelect" class="form-control" style="padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem; cursor: pointer;" title="Quick Date Jump">
                            ${monthNames.map((m, idx) => `<option value="${idx}">${m}</option>`).join('')}
                        </select>
                        <select id="calYearJumpSelect" class="form-control" style="padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem; cursor: pointer;" title="Quick Year Jump">
                            ${[this.currentYear - 2, this.currentYear - 1, this.currentYear, this.currentYear + 1, this.currentYear + 2].map(y => `<option value="${y}">${y}</option>`).join('')}
                        </select>
                        <span class="badge soft-badge" id="calendarMonthBadge"><i class="fa-solid fa-calendar-days"></i> <span id="calBadgeText">${monthNames[this.currentMonth]} ${this.currentYear}</span></span>
                    </div>
                </div>
                <div id="calendarContentContainer"></div>
            </div>
        `;

        // Bind Wrapper Controls
        document.getElementById('calPrevBtn')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('calNextBtn')?.addEventListener('click', () => this.changeMonth(1));
        document.getElementById('calTodayBtn')?.addEventListener('click', () => this.jumpToToday());

        document.getElementById('calViewGridBtn')?.addEventListener('click', () => {
            this.viewMode = 'grid';
            this.renderCalendarWrapper();
            this.renderMainContent();
        });
        document.getElementById('calViewAgendaBtn')?.addEventListener('click', () => {
            this.viewMode = 'agenda';
            this.renderCalendarWrapper();
            this.renderMainContent();
        });

        document.getElementById('calExportBtn')?.addEventListener('click', () => this.exportCalendarData());
        document.getElementById('calImportFile')?.addEventListener('change', (e) => this.importCalendarData(e));

        const searchInput = document.getElementById('calSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderMainContent();
            });
        }

        const monthSelect = document.getElementById('calQuickJumpSelect');
        if (monthSelect) {
            monthSelect.value = this.currentMonth;
            monthSelect.addEventListener('change', (e) => {
                this.currentMonth = parseInt(e.target.value, 10);
                this.renderMainContent();
            });
        }

        const yearSelect = document.getElementById('calYearJumpSelect');
        if (yearSelect) {
            yearSelect.value = this.currentYear;
            yearSelect.addEventListener('change', (e) => {
                this.currentYear = parseInt(e.target.value, 10);
                this.renderMainContent();
            });
        }
    }

    /**
     * Renders either grid view or agenda list view based on current state
     */
    renderMainContent() {
        if (this.viewMode === 'agenda') {
            this.renderAgendaView();
        } else {
            this.renderCalendarGrid();
        }
    }

    /**
     * Shifts current view month forward or backward
     */
    changeMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendarWrapper();
        this.renderMainContent();
    }

    /**
     * Instantly jumps view to today's current live date
     */
    jumpToToday() {
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth();
        this.renderCalendarWrapper();
        this.renderMainContent();
    }

    /**
     * Renders full month matrix grid dynamically based on real-time calendar math
     */
    renderCalendarGrid() {
        const container = document.getElementById('calendarContentContainer');
        if (!container) return;
        
        container.innerHTML = `<div class="calendar-placeholder-grid" id="calendarGrid"></div>`;
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        // Update Header Badge and Selectors sync
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const badgeText = document.getElementById('calBadgeText');
        if (badgeText) badgeText.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const monthSelect = document.getElementById('calQuickJumpSelect');
        if (monthSelect) monthSelect.value = this.currentMonth;

        const yearSelect = document.getElementById('calYearJumpSelect');
        if (yearSelect && ![...yearSelect.options].some(opt => parseInt(opt.value) === this.currentYear)) {
            const opt = document.createElement('option');
            opt.value = this.currentYear;
            opt.textContent = this.currentYear;
            yearSelect.appendChild(opt);
            yearSelect.value = this.currentYear;
        }

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.style.cssText = 'font-weight: 700; text-align: center; color: var(--text-secondary); padding: 8px 0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;';
            headerCell.textContent = day;
            grid.appendChild(headerCell);
        });

        const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const totalCells = Math.ceil((firstDayIndex + totalDays) / 7) * 7;

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'glass-card calendar-cell-item';
            
            const dateNum = i - firstDayIndex + 1;

            if (dateNum > 0 && dateNum <= totalDays) {
                const formattedMonth = (this.currentMonth + 1) < 10 ? '0' + (this.currentMonth + 1) : (this.currentMonth + 1);
                const formattedDateNum = dateNum < 10 ? '0' + dateNum : dateNum;
                const dateStr = `${this.currentYear}-${formattedMonth}-${formattedDateNum}`;

                let cellStyles = 'min-height: 90px; padding: 10px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; transition: transform var(--transition-fast), border-color var(--transition-fast); background: var(--bg-main); border-radius: var(--radius-md); position: relative;';
                
                if (dateStr === todayStr) {
                    cellStyles += ' border: 2px solid var(--primary); box-shadow: 0 0 10px rgba(var(--primary-rgb, 99, 102, 241), 0.3);';
                }
                if (dateStr === this.selectedDateStr) {
                    cellStyles += ' outline: 2px solid var(--accent, #38bdf8); background: rgba(var(--primary-rgb, 99, 102, 241), 0.05);';
                }
                cell.style.cssText = cellStyles;

                // Drag & Drop event source and target handlers support
                cell.setAttribute('data-date', dateStr);
                cell.addEventListener('dragover', (e) => e.preventDefault());
                cell.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const sourceDate = e.dataTransfer.getData('text/plain');
                    if (sourceDate && sourceDate !== dateStr) {
                        this.moveEventsBetweenDates(sourceDate, dateStr);
                    }
                });

                let contentHTML = `<span style="font-weight: 600; font-size: 0.8rem; color: var(--text-primary);">${dateNum}</span>`;

                let dayEvents = this.events[dateStr] || [];
                if (this.searchQuery) {
                    dayEvents = dayEvents.filter(evt => evt.title.toLowerCase().includes(this.searchQuery));
                }

                if (dayEvents.length > 0) {
                    contentHTML += `<div style="margin-top: 4px; display: flex; flex-direction: column; gap: 2px; max-height: 55px; overflow-y: auto;">`;
                    dayEvents.forEach(evt => {
                        const titleSafe = this.sanitizeHTML(evt.title);
                        const cat = this.categories[evt.category] || this.categories.default;
                        contentHTML += `
                            <div draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${dateStr}');" title="${titleSafe}" style="font-size: 0.65Num; padding: 2px 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 3px solid ${cat.color}; background: rgba(255,255,255,0.05); border-radius: 2px; cursor: grab;">
                                <i class="fa-solid fa-circle-dot" style="font-size: 0.45rem; color: ${cat.color};"></i> ${titleSafe}
                            </div>
                        `;
                    });
                    contentHTML += `</div>`;
                }

                cell.innerHTML = contentHTML;

                cell.addEventListener('click', () => {
                    this.selectedDateStr = dateStr;
                    this.renderMainContent();
                    this.openEventModal(dateStr, dateNum, this.events[dateStr] || []);
                });
            } else {
                cell.style.cssText = 'min-height: 90px; padding: 10px; opacity: 0.3; pointer-events: none; background: var(--bg-main); border-radius: var(--radius-md); border: 1px solid transparent;';
            }

            grid.appendChild(cell);
        }
    }

    /**
     * Renders chronological mini agenda / list view of current month's upcoming events
     */
    renderAgendaView() {
        const container = document.getElementById('calendarContentContainer');
        if (!container) return;

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const badgeText = document.getElementById('calBadgeText');
        if (badgeText) badgeText.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        // Gather all events for current month
        const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        let monthEventsList = [];

        for (let d = 1; d <= totalDays; d++) {
            const formattedMonth = String(this.currentMonth + 1).padStart(2, '0');
            const formattedDay = String(d).padStart(2, '0');
            const dateStr = `${this.currentYear}-${formattedMonth}-${formattedDay}`;

            if (this.events[dateStr]) {
                this.events[dateStr].forEach(evt => {
                    if (!this.searchQuery || evt.title.toLowerCase().includes(this.searchQuery)) {
                        monthEventsList.push({ dateStr, dayNum: d, ...evt });
                    }
                });
            }
        }

        if (monthEventsList.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--text-secondary); font-style: italic;">
                    <i class="fa-regular fa-calendar-xmark" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                    No events or milestones found for ${monthNames[this.currentMonth]} ${this.currentYear}${this.searchQuery ? ' matching your search' : ''}.
                </div>
            `;
            return;
        }

        let agendaHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto; padding-right: 4px;">
        `;

        monthEventsList.forEach(item => {
            const cat = this.categories[item.category] || this.categories.default;
            agendaHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 10px 14px; border-radius: var(--radius-md); border-left: 4px solid ${cat.color}; border: 1px solid var(--border-glass);">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <span class="badge soft-badge" style="font-weight: 700; font-size: 0.75rem;">${monthNames[this.currentMonth].substr(0, 3)} ${item.dayNum}</span>
                        <span style="font-size: 0.9rem; color: var(--text-primary); font-weight: 500;">${this.sanitizeHTML(item.title)}</span>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="badge" style="background: ${cat.color}22; color: ${cat.color}; font-size: 0.7rem; padding: 2px 8px;">${cat.label}</span>
                        <button class="btn btn-secondary agenda-edit-btn" data-date="${item.dateStr}" data-id="${item.id}" style="padding: 4px 8px; font-size: 0.8rem;" title="Edit Event"><i class="fa-solid fa-pen"></i></button>
                    </div>
                </div>
            `;
        });

        agendaHTML += `</div>`;
        container.innerHTML = agendaHTML;

        // Bind Agenda Row Actions
        container.querySelectorAll('.agenda-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dateStr = e.currentTarget.getAttribute('data-date');
                const parts = dateStr.split('-');
                const dNum = parseInt(parts[2], 10);
                this.openEventModal(dateStr, dNum, this.events[dateStr] || []);
            });
        });
    }

    /**
     * Moves all events from source date to target date (Drag and Drop support)
     */
    moveEventsBetweenDates(sourceDate, targetDate) {
        if (!this.events[sourceDate] || this.events[sourceDate].length === 0) return;
        
        if (!this.events[targetDate]) {
            this.events[targetDate] = [];
        }

        this.events[targetDate].push(...this.events[sourceDate]);
        delete this.events[sourceDate];

        StorageManager.set(this.storageKey, this.events);
        this.renderMainContent();
        ComponentManager.showToast('Milestone matrix shifted successfully!', 'success');
    }

    /**
     * Opens an enterprise-grade modal dialog for managing multiple events/tasks per day with Category selection
     */
    openEventModal(dateStr, dateNum, currentEventsList) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthName = monthNames[this.currentMonth];

        const renderEventsListHTML = () => {
            if (!currentEventsList || currentEventsList.length === 0) {
                return `<p style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic; text-align: center; padding: 10px 0;">No events scheduled for this day yet.</p>`;
            }
            return currentEventsList.map((evt) => {
                const currentCat = evt.category && this.categories[evt.category] ? evt.category : 'default';
                return `
                    <div style="display: flex; gap: 8px; align-items: center; background: var(--bg-card, rgba(255,255,255,0.03)); padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-glass);">
                        <input type="text" class="modal-evt-title-edit" data-id="${evt.id}" value="${this.sanitizeHTML(evt.title)}" placeholder="Event title..." style="flex: 1; padding: 6px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem;">
                        <select class="modal-evt-cat-edit form-control" data-id="${evt.id}" style="padding: 6px; font-size: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary);">
                            ${Object.entries(this.categories).map(([key, val]) => `<option value="${key}" ${key === currentCat ? 'selected' : ''}>${val.label}</option>`).join('')}
                        </select>
                        <button class="btn btn-secondary modal-evt-delete-single" data-id="${evt.id}" title="Delete event" style="padding: 6px 10px; color: var(--danger); border-color: var(--danger);"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                `;
            }).join('');
        };

        const modalHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Scheduled Events Matrix (${currentMonthName} ${dateNum}, ${this.currentYear})</label>
                    <div id="modalEventsListContainer" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
                        ${renderEventsListHTML()}
                    </div>
                </div>
                
                <div style="border-top: 1px solid var(--border-glass); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <label for="modalNewEventInput" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">Add New Milestone / Event</label>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <input type="text" id="modalNewEventInput" placeholder="e.g., Enterprise Product Launch & Review" autocomplete="off" style="flex: 1; min-width: 180px; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem;">
                        <select id="modalNewEventCategory" class="form-control" style="padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); background: var(--bg-main); color: var(--text-primary); font-size: 0.85rem;">
                            ${Object.entries(this.categories).map(([key, val]) => `<option value="${key}">${val.label}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary" id="modalAddEventBtn" style="padding: 10px 16px;"><i class="fa-solid fa-plus"></i> Add</button>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn btn-primary" id="modalSaveAllBtn" style="flex: 1;">
                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                    </button>
                    <button class="btn btn-secondary" id="modalClearAllBtn" style="color: var(--danger); border-color: var(--danger);">Clear Day</button>
                </div>
            </div>
        `;

        window.componentManager = window.componentManager || new ComponentManager();
        componentManager.openModal(`Manage Schedule - ${currentMonthName} ${dateNum}, ${this.currentYear}`, modalHTML);

        const refreshModalListUI = () => {
            const container = document.getElementById('modalEventsListContainer');
            if (container) container.innerHTML = renderEventsListHTML();
            bindDynamicRowEvents();
        };

        const bindDynamicRowEvents = () => {
            document.querySelectorAll('.modal-evt-delete-single').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    currentEventsList = currentEventsList.filter(item => item.id !== id);
                    refreshModalListUI();
                };
            });
        };
        bindDynamicRowEvents();

        const newInputField = document.getElementById('modalNewEventInput');
        const newCatField = document.getElementById('modalNewEventCategory');

        const handleAddAction = () => {
            if (!newInputField) return;
            const val = newInputField.value.trim();
            const catVal = newCatField ? newCatField.value : 'default';
            if (val !== '') {
                currentEventsList.push({
                    id: 'evt_' + Math.random().toString(36).substr(2, 9),
                    title: val,
                    time: '',
                    category: catVal
                });
                newInputField.value = '';
                refreshModalListUI();
                newInputField.focus();
            }
        };

        document.getElementById('modalAddEventBtn')?.addEventListener('click', handleAddAction);
        newInputField?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddAction();
        });

        document.getElementById('modalSaveAllBtn')?.addEventListener('click', () => {
            document.querySelectorAll('.modal-evt-title-edit').forEach(input => {
                const id = input.getAttribute('data-id');
                const updatedTitle = input.value.trim();
                const targetEvt = currentEventsList.find(item => item.id === id);
                if (targetEvt) targetEvt.title = updatedTitle;
            });

            document.querySelectorAll('.modal-evt-cat-edit').forEach(select => {
                const id = select.getAttribute('data-id');
                const updatedCat = select.value;
                const targetEvt = currentEventsList.find(item => item.id === id);
                if (targetEvt) targetEvt.category = updatedCat;
            });

            const filtered = currentEventsList.filter(item => item.title && item.title.trim() !== '');

            if (filtered.length === 0) {
                delete this.events[dateStr];
                ComponentManager.showToast('Calendar entries removed for date.', 'info');
            } else {
                this.events[dateStr] = filtered;
                ComponentManager.showToast('Calendar updated successfully!', 'success');
            }

            StorageManager.set(this.storageKey, this.events);
            window.componentManager.closeModal();
            this.renderMainContent();
        });

        document.getElementById('modalClearAllBtn')?.addEventListener('click', () => {
            delete this.events[dateStr];
            StorageManager.set(this.storageKey, this.events);
            window.componentManager.closeModal();
            this.renderMainContent();
            ComponentManager.showToast('All events cleared from matrix for this date.', 'info');
        });
    }

    /**
     * Exports all calendar events to a downloadable JSON / ICS file format
     */
    exportCalendarData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.events, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `lifeflow_calendar_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        ComponentManager.showToast('Calendar database exported successfully!', 'success');
    }

    /**
     * Imports calendar events from an uploaded JSON file backup
     */
    importCalendarData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed && typeof parsed === 'object') {
                    this.events = parsed;
                    StorageManager.set(this.storageKey, this.events);
                    this.renderMainContent();
                    ComponentManager.showToast('Calendar restored successfully from backup!', 'success');
                } else {
                    throw new Error('Invalid format');
                }
            } catch (err) {
                console.error('[CalendarModule] Import failed:', err);
                ComponentManager.showToast('Failed to parse backup file.', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    /**
     * Safeguard helper to prevent XSS string injections inside rendered HTML views
     */
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
}

// Global scope registration for app orchestrator
window.CalendarModule = CalendarModule;
