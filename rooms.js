/**
 * VIVIDSCRIBE ROOM ARCHITECTURE & LOBBY MANAGEMENT CONTROLLER
 * মাল্টিপ্লেয়ার রুম তৈরি, টোকেন ভ্যালিডেশন এবং গেম ইন্টারফেস ট্রানজিশন হ্যান্ডেল করে।
 */

const RoomController = {
    activeRoomCode: null,

    /**
     * লবি ইন্টারফেসের সমস্ত বাটন এবং ইনপুট লিসেনার কানেক্ট করে
     */
    initialize() {
        this.bindLobbyUIEvents();
    },

    /**
     * লবির বাটনগুলোর ক্লিক ইভেন্ট লিসেনার সেটআপ
     */
    bindLobbyUIEvents() {
        const btnCreate = document.getElementById("btn-lobby-create-room");
        const btnJoin = document.getElementById("btn-lobby-join-token");
        const btnOffline = document.getElementById("btn-lobby-offline-practice");
        const inputToken = document.getElementById("input-lobby-join-token");
        const btnLeave = document.getElementById("btn-arena-leave");
        const btnCopy = document.getElementById("btn-copy-room-link");

        if (btnCreate) {
            btnCreate.addEventListener("click", () => this.handleRoomCreation());
        }

        if (btnJoin && inputToken) {
            btnJoin.addEventListener("click", () => {
                const token = inputToken.value.trim().toUpperCase();
                this.handleRoomJoin(token);
            });
        }

        if (btnOffline) {
            btnOffline.addEventListener("click", () => this.startOfflineSandboxMode());
        }

        if (btnLeave) {
            btnLeave.addEventListener("click", () => this.exitCurrentMatchArena());
        }

        if (btnCopy) {
            btnCopy.addEventListener("click", () => this.copyRoomIdentityToClipboard());
        }
    },

    /**
     * নতুন একটি সুরক্ষিত রুম টোকেন তৈরি করে ইন্টারফেসে প্রবেশ করায়
     */
    handleRoomCreation() {
        if (!window.Utils) return;
        
        const newRoomCode = window.Utils.generateSecureToken();
        this.activeRoomCode = newRoomCode;
        
        if (window.PlayerEngine) {
            window.PlayerEngine.localProfile.isHost = true;
        }

        this.transitionToScreen("view-match-arena");
        this.updateArenaMetaTags();

        if (window.AnimationSystem) {
            window.AnimationSystem.triggerToast(`Secure Room ${newRoomCode} generated.`, "success");
        }

        // নেটওয়ার্ক মডিউল কানেকশনের হুক
        if (window.NetworkInterface && typeof window.NetworkInterface.connectToRoom === "function") {
            window.NetworkInterface.connectToRoom(newRoomCode);
        }
    },

    /**
     * টোকেন ভেরিফাই করে নির্দিষ্ট রুমে প্রবেশ করার লজিক
     */
    handleRoomJoin(token) {
        if (!token || token.length < 6) {
            if (window.AnimationSystem) {
                window.AnimationSystem.triggerToast("Invalid token sequence format.", "error");
            }
            return;
        }

        this.activeRoomCode = token;
        if (window.PlayerEngine) {
            window.PlayerEngine.localProfile.isHost = false; // জয়েন করা প্লেয়ার সাধারণত হোস্ট হয় না
        }

        this.transitionToScreen("view-match-arena");
        this.updateArenaMetaTags();

        if (window.NetworkInterface && typeof window.NetworkInterface.connectToRoom === "function") {
            window.NetworkInterface.connectToRoom(token);
        }
    },

    /**
     * সিঙ্গেল প্লেয়ার বা অফলাইন প্র্যাকটিস বোর্ড চালু করার মেকানিজম
     */
    startOfflineSandboxMode() {
        this.activeRoomCode = "OFFLINE_SANDBOX";
        if (window.PlayerEngine) {
            window.PlayerEngine.localProfile.isHost = true;
        }

        this.transitionToScreen("view-match-arena");
        this.updateArenaMetaTags();

        if (window.AnimationSystem) {
            window.AnimationSystem.triggerToast("Offline creative arena successfully initialized.", "warning");
        }

        // অফলাইন ড্রয়িং ক্যানভাস আনলক করা
        const toolDock = document.getElementById("canvas-tool-dock");
        if (toolDock) {
            toolDock.classList.remove("active-lock");
        }
    },

    /**
     * ম্যাচ এরিনা বা গেম থেকে বের হয়ে মেইন লবিতে ফিরে যাওয়ার প্রসেস
     */
    exitCurrentMatchArena() {
        this.activeRoomCode = null;
        this.transitionToScreen("view-main-lobby");
        
        if (window.NetworkInterface && typeof window.NetworkInterface.disconnectFromRoom === "function") {
            window.NetworkInterface.disconnectFromRoom();
        }

        // ক্যানভাস টুল ডক পুনরায় লক করা
        const toolDock = document.getElementById("canvas-tool-dock");
        if (toolDock) {
            toolDock.classList.add("active-lock");
        }
    },

    /**
     * স্ক্রিন পরিবর্তন করার জন্য ভিউ প্যানেল ট্রানজিশন লজিক
     */
    transitionToScreen(screenId) {
        const panels = document.querySelectorAll(".view-panel");
        panels.forEach(p => p.classList.add("hidden"));

        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove("hidden");
        }
    },

    /**
     * গেম এরিনার হেডার ড্যাশবোর্ডে রুম কোড আপডেট করা
     */
    updateArenaMetaTags() {
        const txtCode = document.getElementById("txt-arena-room-code");
        if (txtCode && this.activeRoomCode) {
            txtCode.textContent = this.activeRoomCode;
        }
    },

    /**
     * অন্য বন্ধুদের ইনভাইট করার জন্য রুম কোড ক্লিপবোর্ডে কপি করা
     */
    copyRoomIdentityToClipboard() {
        if (!this.activeRoomCode) return;
        
        navigator.clipboard.writeText(this.activeRoomCode).then(() => {
            if (window.AnimationSystem) {
                window.AnimationSystem.triggerToast("Room code successfully copied to secure clipboard.", "success");
            }
        }).catch(err => {
            console.error("Clipboard copy fault:", err);
        });
    }
};

window.RoomController = RoomController;
