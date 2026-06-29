/**
 * VIVIDSCRIBE CENTRAL CONTROL UNIT & MAIN GAME CONTROLLER
 * প্রজেক্টের মেইন কোঅর্ডিনেটর। সমস্ত মডিউল ইনিশিয়ালাইজেশন এবং সেন্ট্রাল গেম স্টেট কন্ট্রোল করে।
 */

const GameCoordinator = {
    gameState: {
        currentRound: 1,
        maxRounds: 3,
        isActive: false,
        matchPhase: "lobby" // lobby, choosing, drawing, summary
    },

    /**
     * পেজ লোড বা ডম (DOM) রেডি হওয়ার পর প্রথম এই এন্ট্রি পয়েন্টটি কল হবে
     */
    bootAppPipeline() {
        console.log("Initializing VividScribe System Components...");

        // ১. কোর ডাটা এবং সেটিংস ইঞ্জিন সেটআপ
        if (window.PlayerEngine) window.PlayerEngine.initialize();
        if (window.StorageEngine) {
            // আইডেন্টিটি প্রোফাইলের ডাটা মেইন স্ক্রিনের ইনপুট বক্সে সেট করা
            const profile = window.StorageEngine.getIdentityProfile();
            const inputNick = document.getElementById("input-identity-nickname");
            if (inputNick) inputNick.value = profile.nickname;
        }
        if (window.SystemSettings) window.SystemSettings.initialize();

        // ২. ড্রয়িং ও ইউজার ইন্টারফেস মডিউল ইনিশিয়ালাইজেশন
        if (window.CanvasEngine) window.CanvasEngine.initialize();
        if (window.DrawingController) window.DrawingController.initialize();
        if (window.ChatEngine) window.ChatEngine.initialize();
        if (window.MobileAdapter) window.MobileAdapter.initialize();
        if (window.RoomController) window.RoomController.initialize();

        // ৩. মেইন গ্লোবাল UI ইভেন্ট বাইন্ডিং
        this.bindGlobalActionTriggers();

        console.log("All VividScribe Systems Fully Armed & Ready.");
    },

    /**
     * গেমের জেনারেল কিছু বাটন অ্যাকশন (যেমন: সেটিংস মোডাল ওপেন/ক্লোজ) কানেক্ট করা
     */
    bindGlobalActionTriggers() {
        const btnSettings = document.getElementById("btn-trigger-settings");
        const btnCloseSettings = document.getElementById("btn-close-settings");
        const modalSettings = document.getElementById("modal-system-settings");

        if (btnSettings && modalSettings) {
            btnSettings.addEventListener("click", () => {
                modalSettings.classList.remove("hidden");
            });
        }

        if (btnCloseSettings && modalSettings) {
            btnCloseSettings.addEventListener("click", () => {
                modalSettings.classList.add("hidden");
            });
        }

        // লবিতে প্রোফাইল আপডেট বা নিকনেম সেভ করার ইভেন্ট
        const inputNick = document.getElementById("input-identity-nickname");
        if (inputNick) {
            inputNick.addEventListener("change", (e) => {
                if (window.PlayerEngine && window.StorageEngine) {
                    window.PlayerEngine.localProfile.nickname = e.target.value;
                    window.StorageEngine.saveIdentityProfile(window.PlayerEngine.localProfile);
                    
                    if (window.AnimationSystem) {
                        window.AnimationSystem.triggerToast("Profile Identity Synchronized.", "success", 2000);
                    }
                }
            });
        }
    },

    /**
     * অফলাইন বা সিঙ্গেল প্লেয়ার ম্যাচ স্টার্ট করার প্রসিডিউরাল মেকানিজম
     */
    triggerOfflineMatchLoop() {
        this.gameState.isActive = true;
        this.gameState.currentRound = 1;
        this.gameState.matchPhase = "choosing";

        if (window.ChatEngine) {
            window.ChatEngine.pushMessageToStream("SYSTEM", "Offline Match Matrix Initialized.", "system");
        }

        // শব্দ চয়েস উইন্ডো (Word Picker) পপআপ করা
        if (window.AnimationSystem && window.WordSelectionEngine) {
            const choices = window.WordSelectionEngine.generateWordChoices("medium");
            this.presentWordSelectionModal(choices);
        }
    },

    /**
     * স্ক্রিনের উপর ৩টি র্যান্ডম শব্দ চয়েস করার কাস্টম পপআপ উইন্ডো রেন্ডার করে
     * @param {Array} words - শব্দগুলোর স্ট্রিং অ্যারে
     */
    presentWordSelectionModal(words) {
        if (window.AnimationSystem) {
            window.AnimationSystem.toggleCanvasOverlay("modal-word-picker", true);
        }

        const container = document.getElementById("container-word-options-grid");
        if (!container) return;

        container.innerHTML = "";

        words.forEach(word => {
            const btn = document.createElement("button");
            btn.className = "btn-word-option-node";
            btn.textContent = word.toUpperCase();
            
            btn.addEventListener("click", () => {
                this.finalizeSelectedSecretWord(word);
            });
            
            container.appendChild(btn);
        });
    },

    /**
     * ইউজার শব্দ সিলেক্ট করার পর ম্যাচকে ড্রয়িং ফেসে নিয়ে যায় এবং টাইমার অন করে
     */
    finalizeSelectedSecretWord(word) {
        // মোডাল হাইড করা
        if (window.AnimationSystem) {
            window.AnimationSystem.toggleCanvasOverlay("modal-word-picker", false);
        }

        this.gameState.matchPhase = "drawing";

        if (window.WordSelectionEngine) {
            window.WordSelectionEngine.setSecretWord(word);
            
            // যেহেতু এটি অফলাইন প্র্যাকটিস মোড, ইউজার নিজেই আঁকবে, তাই শব্দ ফুল রিভিল করে দেওয়া
            window.WordSelectionEngine.updateSecretDisplayUI(true);
        }

        // সেটিংস থেকে ড্র টাইম (Draw Time) নিয়ে টাইমার চালু করা
        const drawTime = window.SystemSettings ? window.SystemSettings.state.drawTime : 60;
        
        if (window.CountdownTimer) {
            window.CountdownTimer.start(drawTime, 
                // ওন-টিক কলব্যাক
                (remaining) => {
                    if (remaining === 10 && window.AnimationSystem) {
                        window.AnimationSystem.triggerToast("Hurry Up! 10 Seconds Remaining!", "warning");
                    }
                },
                // সময় শেষ হওয়ার কলব্যাক
                () => {
                    this.executeRoundSummaryPhase();
                }
            );
        }
    },

    /**
     * টাইমারের সময় শেষ হলে বা সবাই গেস কমপ্লিট করলে রাউন্ড শেষ করার লজিক
     */
    executeRoundSummaryPhase() {
        this.gameState.matchPhase = "summary";
        if (window.CountdownTimer) window.CountdownTimer.stop();

        if (window.ChatEngine) {
            window.ChatEngine.pushMessageToStream("SYSTEM", "Round Finished. Synchronizing score cards.", "system");
        }

        if (window.AnimationSystem) {
            window.AnimationSystem.triggerToast("Round Complete!", "success");
        }
        
        // প্র্যাকটিস বোর্ডের জন্য অটোমেটিক ৩ সেকেন্ড পর নতুন রাউন্ড জেনারেট বা লুপ ক্লিয়ার করা
        setTimeout(() => {
            if (this.gameState.currentRound < this.gameState.maxRounds) {
                this.gameState.currentRound++;
                // ক্যানভাস ক্লিয়ার করে পরবর্তী রাউন্ড শুরু করা
                if (window.CanvasEngine) window.CanvasEngine.clearSurfaceMatrix();
                this.triggerOfflineMatchLoop();
            } else {
                this.gameState.isActive = false;
                this.gameState.matchPhase = "lobby";
                if (window.ChatEngine) {
                    window.ChatEngine.pushMessageToStream("SYSTEM", "Creative Arena Sandbox Terminated. Returning to Lobby.", "system");
                }
                if (window.RoomController) window.RoomController.exitCurrentMatchArena();
            }
        }, 4000);
    }
};

// যখন সম্পূর্ণ DOM কন্টেন্ট রেডি হবে, তখন গেম ইঞ্জিন বুট হবে
document.addEventListener("DOMContentLoaded", () => {
    GameCoordinator.bootAppPipeline();
});

window.GameCoordinator = GameCoordinator;
