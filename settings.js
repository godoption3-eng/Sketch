/**
 * VIVIDSCRIBE GLOBAL SYSTEM CONFIGURATION & COMPONENT MANAGEMENT INTERFACE
 * Implements master sound volume tracking, difficulty settings, and hosts authority updates.
 */

const SystemSettings = {
    // Current runtime system variables values layout data structure matrix
    state: {
        masterVolume: 75,
        sfxEnabled: true,
        rounds: 3,
        drawTime: 60,
        vocabulary: "medium",
        customWords: []
    },

    /**
     * Mounts structural DOM interface listeners to drive variable mutation inputs safely
     */
    initialize() {
        this.loadCachedSettings();
        this.bindDOMEvents();
        this.syncInterfaceElements();
    },

    /**
     * Restores parameters metrics from client disk configurations data structures
     */
    loadCachedSettings() {
        const cached = window.StorageEngine.get("system_config", null);
        if (cached) {
            this.state = { ...this.state, ...cached };
        }
    },

    /**
     * Direct linking logic bound to setting dialog view panels elements
     */
    bindDOMEvents() {
        const sliderVol = document.getElementById("slider-volume-master");
        const txtVol = document.getElementById("txt-vol-master-lbl");
        const toggleSfx = document.getElementById("toggle-sfx-state");
        const selectRounds = document.getElementById("select-room-round-count");
        const selectTime = document.getElementById("select-room-draw-time");
        const selectDiff = document.getElementById("select-word-difficulty");
        const textCustom = document.getElementById("textarea-custom-words");
        const btnSave = document.getElementById("btn-settings-save-apply");
        const btnClose = document.getElementById("btn-close-settings");
        const modal = document.getElementById("modal-system-settings");

        // Realtime continuous slide metrics updating feedback triggers pipeline
        if (sliderVol && txtVol) {
            sliderVol.addEventListener("input", (e) => {
                const val = parseInt(e.target.value, 10);
                txtVol.textContent = val + "%";
                this.state.masterVolume = val;
                if (window.AudioPipeline) {
                    window.AudioPipeline.updateMasterVolume(val);
                }
            });
        }

        if (toggleSfx) {
            toggleSfx.addEventListener("change", (e) => {
                this.state.sfxEnabled = e.target.checked;
            });
        }

        // Apply context modifications execution routine
        if (btnSave) {
            btnSave.addEventListener("click", () => {
                this.state.rounds = parseInt(selectRounds.value, 10);
                this.state.drawTime = parseInt(selectTime.value, 10);
                this.state.vocabulary = selectDiff.value;
                
                if (textCustom) {
                    this.state.customWords = textCustom.value.split(",")
                        .map(w => w.trim().toLowerCase())
                        .filter(w => w.length > 0);
                }

                window.StorageEngine.set("system_config", this.state);
                
                // Network synchronization hooks check
                if (window.NetworkInterface && window.NetworkInterface.isConnected()) {
                    window.NetworkInterface.sendSystemConfigUpdate(this.state);
                } else if (window.OfflinePracticeEngine && window.OfflinePracticeEngine.isActive) {
                    window.OfflinePracticeEngine.applyParameters(this.state);
                }

                modal.classList.add("hidden");
                if (window.AnimationSystem) {
                    window.AnimationSystem.triggerToast("Configuration changes initialized successfully.", "success");
                }
            });
        }

        if (btnClose) {
            btnClose.addEventListener("click", () => {
                modal.classList.add("hidden");
                this.syncInterfaceElements(); // Revert unsaved mutations
            });
        }
    },

    /**
     * Refreshes inputs matching local model variations definitions
     */
    syncInterfaceElements() {
        const sliderVol = document.getElementById("slider-volume-master");
        const txtVol = document.getElementById("txt-vol-master-lbl");
        const toggleSfx = document.getElementById("toggle-sfx-state");
        const selectRounds = document.getElementById("select-room-round-count");
        const selectTime = document.getElementById("select-room-draw-time");
        const selectDiff = document.getElementById("select-word-difficulty");
        const textCustom = document.getElementById("textarea-custom-words");

        if (sliderVol) sliderVol.value = this.state.masterVolume;
        if (txtVol) txtVol.textContent = this.state.masterVolume + "%";
        if (toggleSfx) toggleSfx.checked = this.state.sfxEnabled;
        if (selectRounds) selectRounds.value = this.state.rounds;
        if (selectTime) selectTime.value = this.state.drawTime;
        if (selectDiff) selectDiff.value = this.state.vocabulary;
        if (textCustom) textCustom.value = this.state.customWords.join(", ");
    },

    /**
     * Adjusts structural read-only restrictions for spectator mode settings profiles
     * @param {boolean} isHost 
     */
    setHostControlContext(isHost) {
        const hostWrapper = document.getElementById("host-controls-wrapper");
        if (hostWrapper) {
            if (isHost) {
                hostWrapper.classList.remove("disabled-host-context");
            } else {
                hostWrapper.classList.add("disabled-host-context");
            }
        }
    }
};

window.SystemSettings = SystemSettings;
