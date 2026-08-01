/**
 * @module PomodoroModule
 * @description Enterprise-grade Pomodoro Focus Timer with Task Integration, Ambient Sound Generator, Custom Intervals, and State Persistence.
 * @version 3.0.0
 * @author Architect Pro
 */
class PomodoroModule {
    constructor() {
        this.storageKey = 'lifeflow_pomodoro_state';
        this.settingsKey = 'lifeflow_pomodoro_settings';
        
        // Load settings or defaults
        const savedSettings = this.loadSettings();
        this.workTime = savedSettings.workTime || 25 * 60;
        this.breakTime = savedSettings.breakTime || 5 * 60;
        this.longBreakTime = savedSettings.longBreakTime || 15 * 60;
        
        // Load active state or defaults
        this.timeLeft = this.workTime;
        this.timerId = null;
        this.isRunning = false;
        this.isWorkSession = true;
        this.sessionCount = 0;
        this.currentTask = 'General Deep Work';
        this.ambientSound = 'none'; // 'none', 'rain', 'brownnoise'
        this.audioCtx = null;
        this.ambientNode = null;

        this.init();
    }

    init() {
        try {
            this.renderPomodoroView();
            this.bindEvents();
            this.restoreState();
            this.updateDisplay();
        } catch (error) {
            console.error('[PomodoroModule] Initialization failed:', error);
            if (typeof ComponentManager !== 'undefined' && ComponentManager.showToast) {
                ComponentManager.showToast('Failed to initialize Pomodoro Timer.', 'error');
            }
        }
    }

    /**
     * Renders the complete modern UI with settings modal, task linking, and ambient sound controls.
     */
    renderPomodoroView() {
        const viewSection = document.getElementById('view-pomodoro');
        if (!viewSection) return;

        viewSection.innerHTML = `
            <div class="glass-card" style="max-width: 680px; margin: 0 auto; text-align: center; padding: 35px; display: flex; flex-direction: column; gap: 20px; position: relative;">
                
                <!-- Top Header Bar -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="text-align: left;">
                        <h2 style="font-size: 1.4rem; font-weight: 700;"><i class="fa-solid fa-stopwatch"></i> Pomodoro Focus Hub</h2>
                        <p class="date-subtitle" style="margin: 0;">Precision deep work & ambient focus architecture</p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="badge soft-badge" id="pomodoroModeBadge"><i class="fa-solid fa-bolt"></i> Deep Work</span>
                        <button class="btn btn-secondary" id="pomodoroSettingsBtn" style="padding: 6px 10px; border-radius: var(--radius-full);" title="Settings"><i class="fa-solid fa-gear"></i></button>
                    </div>
                </div>

                <!-- Mode Selectors -->
                <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 5px;">
                    <button class="btn btn-secondary active-mode-btn" id="setWorkMode" style="font-size: 0.8rem; padding: 6px 14px; border-radius: var(--radius-full);">Work</button>
                    <button class="btn btn-secondary" id="setShortBreak" style="font-size: 0.8rem; padding: 6px 14px; border-radius: var(--radius-full);">Short Break</button>
                    <button class="btn btn-secondary" id="setLongBreak" style="font-size: 0.8rem; padding: 6px 14px; border-radius: var(--radius-full);">Long Break</button>
                </div>

                <!-- Task Linking Bar -->
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); padding: 10px 16px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <span style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;"><i class="fa-solid fa-list-check"></i> Focusing on:</span>
                    <input type="text" id="pomodoroTaskInput" value="General Deep Work" placeholder="What are you working on?" style="background: transparent; border: none; color: var(--text-primary); font-size: 0.9rem; width: 100%; outline: none; font-weight: 500;">
                </div>

                <!-- Main Countdown Display -->
                <div id="pomodoroDisplay" style="font-size: 5.5rem; font-family: 'Outfit', sans-serif; font-weight: 700; color: var(--primary); letter-spacing: -0.02em; margin: 5px 0;">25:00</div>

                <!-- Timer Controls -->
                <div style="display: flex; justify-content: center; gap: 12px;">
                    <button class="btn btn-primary" id="pomodoroStartBtn" style="padding: 10px 28px;"><i class="fa-solid fa-play"></i> Start</button>
                    <button class="btn btn-secondary" id="pomodoroPauseBtn" style="padding: 10px 28px;"><i class="fa-solid fa-pause"></i> Pause</button>
                    <button class="btn btn-secondary" id="pomodoroResetBtn" style="padding: 10px 28px;"><i class="fa-solid fa-rotate-right"></i> Reset</button>
                </div>

                <!-- Ambient Sound & Session Footer Bar -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-glass); padding-top: 16px; margin-top: 5px; font-size: 0.85rem; color: var(--text-secondary); flex-wrap: wrap; gap: 10px;">
                    <span>Completed Sessions: <strong id="pomodoroSessionCount" style="color: var(--text-primary);">0</strong></span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span><i class="fa-solid fa-headphones"></i> Ambient:</span>
                        <select id="ambientSoundSelect" style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-glass); border-radius: var(--radius-sm); padding: 4px 8px; font-size: 0.8rem; outline: none;">
                            <option value="none">None</option>
                            <option value="rain">Gentle Rain</option>
                            <option value="brownnoise">Brown Noise</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Settings Modal (Hidden by default) -->
            <div id="pomodoroSettingsModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; justify-content: center; align-items: center;">
                <div class="glass-card" style="width: 400px; padding: 25px; display: flex; flex-direction: column; gap: 16px; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="font-size: 1.1rem; font-weight: 700;"><i class="fa-solid fa-gear"></i> Timer Intervals</h3>
                        <button class="btn btn-secondary" id="closePomodoroSettings" style="padding: 4px 10px;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label style="font-size: 0.85rem; color: var(--text-secondary);">Work Duration (minutes)</label>
                        <input type="number" id="settingWorkMins" value="25" min="1" max="120" style="padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); background: transparent; color: var(--text-primary);">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label style="font-size: 0.85rem; color: var(--text-secondary);">Short Break Duration (minutes)</label>
                        <input type="number" id="settingBreakMins" value="5" min="1" max="60" style="padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); background: transparent; color: var(--text-primary);">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label style="font-size: 0.85rem; color: var(--text-secondary);">Long Break Duration (minutes)</label>
                        <input type="number" id="settingLongBreakMins" value="15" min="1" max="60" style="padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); background: transparent; color: var(--text-primary);">
                    </div>
                    <button class="btn btn-primary" id="savePomodoroSettings" style="margin-top: 10px;">Save Changes</button>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const startBtn = document.getElementById('pomodoroStartBtn');
        const pauseBtn = document.getElementById('pomodoroPauseBtn');
        const resetBtn = document.getElementById('pomodoroResetBtn');

        const workModeBtn = document.getElementById('setWorkMode');
        const shortBreakBtn = document.getElementById('setShortBreak');
        const longBreakBtn = document.getElementById('setLongBreak');

        const taskInput = document.getElementById('pomodoroTaskInput');
        const ambientSelect = document.getElementById('ambientSoundSelect');

        const settingsBtn = document.getElementById('pomodoroSettingsBtn');
        const closeSettingsBtn = document.getElementById('closePomodoroSettings');
        const saveSettingsBtn = document.getElementById('savePomodoroSettings');
        const settingsModal = document.getElementById('pomodoroSettingsModal');

        if (startBtn) startBtn.addEventListener('click', () => this.startTimer());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseTimer());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetTimer());

        if (workModeBtn) workModeBtn.addEventListener('click', () => this.setMode(this.workTime / 60, true, workModeBtn));
        if (shortBreakBtn) shortBreakBtn.addEventListener('click', () => this.setMode(this.breakTime / 60, false, shortBreakBtn));
        if (longBreakBtn) longBreakBtn.addEventListener('click', () => this.setMode(this.longBreakTime / 60, false, longBreakBtn));

        if (taskInput) {
            taskInput.addEventListener('input', (e) => {
                this.currentTask = e.target.value;
                this.saveState();
            });
        }

        if (ambientSelect) {
            ambientSelect.addEventListener('change', (e) => {
                this.ambientSound = e.target.value;
                if (this.isRunning) {
                    this.playAmbientSound(this.ambientSound);
                }
            });
        }

        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                document.getElementById('settingWorkMins').value = this.workTime / 60;
                document.getElementById('settingBreakMins').value = this.breakTime / 60;
                document.getElementById('settingLongBreakMins').value = this.longBreakTime / 60;
                settingsModal.style.display = 'flex';
            });
        }

        if (closeSettingsBtn && settingsModal) {
            closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');
        }

        if (saveSettingsBtn && settingsModal) {
            saveSettingsBtn.addEventListener('click', () => {
                const newWork = parseInt(document.getElementById('settingWorkMins').value) || 25;
                const newBreak = parseInt(document.getElementById('settingBreakMins').value) || 5;
                const newLong = parseInt(document.getElementById('settingLongBreakMins').value) || 15;

                this.workTime = newWork * 60;
                this.breakTime = newBreak * 60;
                this.longBreakTime = newLong * 60;
                this.timeLeft = this.workTime;

                this.saveSettings();
                settingsModal.style.display = 'none';
                this.updateDisplay();
                
                if (typeof ComponentManager !== 'undefined') {
                    ComponentManager.showToast('Pomodoro intervals updated successfully!', 'success');
                }
            });
        }
    }

    setMode(minutes, isWork, activeBtn) {
        if (this.isRunning) {
            clearInterval(this.timerId);
            this.isRunning = false;
            this.stopAmbientSound();
        }

        document.querySelectorAll('#view-pomodoro .btn-secondary').forEach(btn => {
            if(btn.id.includes('set')) btn.style.background = 'transparent';
        });
        if(activeBtn) activeBtn.style.background = 'var(--primary-light)';

        this.isWorkSession = isWork;
        this.timeLeft = minutes * 60;

        const badge = document.getElementById('pomodoroModeBadge');
        if (badge) {
            badge.innerHTML = isWork ? `<i class="fa-solid fa-bolt"></i> Deep Work` : `<i class="fa-solid fa-mug-hot"></i> Break Time`;
        }

        this.updateDisplay();
        this.saveState();
    }

    startTimer() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        // Start background ambient sound if selected
        this.playAmbientSound(this.ambientSound);

        if (typeof ComponentManager !== 'undefined' && ComponentManager.showToast) {
            ComponentManager.showToast(this.isWorkSession ? `Started session: "${this.currentTask}"` : 'Break session started!', 'success');
        }

        // Timestamp tracking for accurate background tab countdown execution
        let lastTimestamp = Date.now();

        this.timerId = setInterval(() => {
            const now = Date.now();
            const deltaSeconds = Math.round((now - lastTimestamp) / 1000);
            
            if (deltaSeconds >= 1) {
                lastTimestamp = now;
                if (this.timeLeft > 0) {
                    this.timeLeft -= deltaSeconds;
                    if (this.timeLeft < 0) this.timeLeft = 0;
                    this.updateDisplay();
                    this.saveState();
                }

                if (this.timeLeft <= 0) {
                    clearInterval(this.timerId);
                    this.isRunning = false;
                    this.stopAmbientSound();
                    this.playAlarmSound();
                    
                    if (typeof confetti !== 'undefined') {
                        confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 } });
                    }

                    if (this.isWorkSession) {
                        this.sessionCount++;
                        const countEl = document.getElementById('pomodoroSessionCount');
                        if (countEl) countEl.textContent = this.sessionCount;
                        this.logCompletedSession();
                    }

                    if (typeof ComponentManager !== 'undefined') {
                        ComponentManager.showToast('Pomodoro interval finished!', 'success');
                    }
                    
                    // Toggle session type automatically
                    this.isWorkSession = !this.isWorkSession;
                    this.timeLeft = this.isWorkSession ? this.workTime : this.breakTime;
                    
                    const badge = document.getElementById('pomodoroModeBadge');
                    if (badge) {
                        badge.innerHTML = this.isWorkSession ? `<i class="fa-solid fa-bolt"></i> Deep Work` : `<i class="fa-solid fa-mug-hot"></i> Break Time`;
                    }

                    this.updateDisplay();
                    this.saveState();
                }
            }
        }, 1000);
    }

    pauseTimer() {
        if (!this.isRunning) return;
        clearInterval(this.timerId);
        this.isRunning = false;
        this.stopAmbientSound();
        this.saveState();
        if (typeof ComponentManager !== 'undefined') {
            ComponentManager.showToast('Pomodoro timer paused.', 'info');
        }
    }

    resetTimer() {
        clearInterval(this.timerId);
        this.isRunning = false;
        this.stopAmbientSound();
        this.isWorkSession = true;
        this.timeLeft = this.workTime;
        this.updateDisplay();
        this.saveState();
        if (typeof ComponentManager !== 'undefined') {
            ComponentManager.showToast('Timer reset to default.', 'info');
        }
    }

    updateDisplay() {
        const display = document.getElementById('pomodoroDisplay');
        if (!display) return;

        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        if (this.isRunning) {
            document.title = `(${display.textContent}) ${this.currentTask} | LifeFlow AI`;
        } else {
            document.title = `LifeFlow AI - AI Productivity & Life Architecture Platform`;
        }
    }

    // --- State Persistence & Storage Handling ---
    saveState() {
        const state = {
            timeLeft: this.timeLeft,
            isWorkSession: this.isWorkSession,
            sessionCount: this.sessionCount,
            currentTask: this.currentTask,
            ambientSound: this.ambientSound,
            lastUpdated: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(state));
    }

    restoreState() {
        const saved = localStorage.getItem(this.storageKey);
        if (!saved) return;

        try {
            const state = JSON.parse(saved);
            this.sessionCount = state.sessionCount || 0;
            this.currentTask = state.currentTask || 'General Deep Work';
            this.ambientSound = state.ambientSound || 'none';
            
            const countEl = document.getElementById('pomodoroSessionCount');
            if (countEl) countEl.textContent = this.sessionCount;

            const taskInput = document.getElementById('pomodoroTaskInput');
            if (taskInput) taskInput.value = this.currentTask;

            const ambientSelect = document.getElementById('ambientSoundSelect');
            if (ambientSelect) ambientSelect.value = this.ambientSound;

            // Handle background time drift if user reloaded while running
            if (state.lastUpdated && state.timeLeft) {
                const elapsedSeconds = Math.floor((Date.now() - state.lastUpdated) / 1000);
                this.timeLeft = Math.max(0, state.timeLeft - elapsedSeconds);
                this.isWorkSession = state.isWorkSession;
            }
        } catch (e) {
            console.error('Error restoring pomodoro state:', e);
        }
    }

    loadSettings() {
        try {
            const data = localStorage.getItem(this.settingsKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    saveSettings() {
        const settings = {
            workTime: this.workTime,
            breakTime: this.breakTime,
            longBreakTime: this.longBreakTime
        };
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }

    logCompletedSession() {
        try {
            const historyKey = 'lifeflow_pomodoro_history';
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            history.push({
                task: this.currentTask,
                durationMinutes: this.workTime / 60,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to log session history:', e);
        }
    }

    // --- Web Audio Synthesizer & Ambient Sound Engines ---
    playAlarmSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.25);     // A5
            
            gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
        } catch (e) {
            console.log('Audio notification error:', e);
        }
    }

    playAmbientSound(type) {
        this.stopAmbientSound();
        if (type === 'none') return;

        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = 2 * this.audioCtx.sampleRate;
            const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                let white = Math.random() * 2 - 1;
                if (type === 'brownnoise') {
                    // Approximate brownian noise generation
                    output[i] = (i === 0) ? white : (output[i - 1] + (0.02 * white)) / 1.02;
                    output[i] *= 3.5; // Gain compensation
                } else {
                    // White noise baseline for rain simulation filter effect
                    output[i] = white;
                }
            }

            const whiteNoise = this.audioCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
            filter.frequency.value = type === 'rain' ? 800 : 1000;

            const gainNode = this.audioCtx.createGain();
            gainNode.gain.value = 0.08; // Subtle background volume level

            whiteNoise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            whiteNoise.start();
            this.ambientNode = { source: whiteNoise, context: this.audioCtx };
        } catch (e) {
            console.log('Ambient sound generation error:', e);
        }
    }

    stopAmbientSound() {
        if (this.ambientNode) {
            try {
                this.ambientNode.source.stop();
                if (this.ambientNode.context.state !== 'closed') {
                    this.ambientNode.context.close();
                }
            } catch (e) {
                // Ignore cleanup race conditions
            }
            this.ambientNode = null;
        }
    }
}

window.PomodoroModule = PomodoroModule;
