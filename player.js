/**
 * VIVIDSCRIBE OPERATIVE PROFILE & ROSTER ENGINE
 * প্লেয়ার প্রোফাইল স্টেট ম্যানেজমেন্ট এবং ডাইনামিক রোস্টার UI কম্পোনেন্ট কন্ট্রোল করে।
 */

const PlayerEngine = {
    localProfile: {
        id: "",
        nickname: "",
        avatarHue: 0,
        score: 0,
        isHost: false,
        isDrawing: false,
        hasGuessed: false
    },

    /**
     * স্টোরেজ থেকে ডেটা নিয়ে লোকাল প্লেয়ার প্রোফাইল ইনিশিয়ালাইজ করে
     */
    initialize() {
        if (window.StorageEngine) {
            const cached = window.StorageEngine.getIdentityProfile();
            this.localProfile.nickname = cached.nickname;
            this.localProfile.avatarHue = cached.avatarHue;
        } else {
            this.localProfile.nickname = "Operative_" + Math.floor(1000 + Math.random() * 9000);
            this.localProfile.avatarHue = Math.floor(Math.random() * 360);
        }
        this.localProfile.id = "p_" + Math.random().toString(36).substr(2, 9);
    },

    /**
     * প্লেয়ার রোস্টারে নতুন প্লেয়ারদের ডেটা রেন্ডার বা আপডেট করে
     * @param {Array} playersList - রুমের সব প্লেয়ারদের অবজেক্ট অ্যারে
     */
    renderRoster(playersList) {
        const container = document.getElementById("container-player-roster");
        const countBadge = document.getElementById("txt-roster-count");
        
        if (!container) return;
        container.innerHTML = "";

        if (countBadge) {
            countBadge.textContent = playersList.length;
        }

        playersList.forEach(player => {
            const card = document.createElement("div");
            card.className = "player-roster-card";
            
            // স্টেট অনুযায়ী কাস্টম সিএসএস ক্লাস যোগ করা
            if (player.isDrawing) card.classList.add("state-drawing");
            if (player.hasGuessed) card.classList.add("state-guessed");
            if (player.id === this.localProfile.id) card.classList.add("state-self");

            // প্লেয়ারের ইউনিক কালার অনুযায়ী অবতারের ব্যাকগ্রাউন্ড জেনারেট করা
            const avatarStyle = `background: hsl(${player.avatarHue}, 70%, 45%);`;
            
            // হোসট ইন্ডিকেটর লজিক
            const hostTag = player.isHost ? `<span class="roster-host-indicator" title="Room Host">👑</span>` : "";
            
            // কারেন্ট স্টেট আইকন
            let statusIcon = "";
            if (player.isDrawing) {
                statusIcon = `<svg class="icon-drawing-brush" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
            } else if (player.hasGuessed) {
                statusIcon = `<svg class="icon-guessed-check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            }

            // অ্যাডমিন অ্যাকশন কন্ট্রোল (যদি কারেন্ট ইউজার হোস্ট হয় এবং এই কার্ডটি অন্য প্লেয়ারের হয়)
            const isSelf = player.id === this.localProfile.id;
            const adminActionsClass = (this.localProfile.isHost && !isSelf) ? "roster-admin-actions host-enabled" : "roster-admin-actions";

            card.innerHTML = `
                <div class="roster-avatar-thumb" style="${avatarStyle}"></div>
                <div class="roster-identity-block">
                    <div class="roster-nick">
                        ${window.Utils ? window.Utils.sanitizeInput(player.nickname) : player.nickname}
                        ${hostTag}
                    </div>
                    <div class="roster-score">${player.score} PTS</div>
                </div>
                <div class="roster-status-icon-wrap">
                    ${statusIcon}
                </div>
                <div class="${adminActionsClass}">
                    <button class="btn-admin-action kick" onclick="PlayerEngine.executeAdminAction('kick', '${player.id}')" title="Kick Player">✕</button>
                </div>
            `;

            container.appendChild(card);
        });
    },

    /**
     * হোস্ট দ্বারা কোনো প্লেয়ারকে কিক বা ব্যান করার অ্যাডমিন লজিক
     */
    executeAdminAction(action, playerId) {
        if (!this.localProfile.isHost) return;
        
        console.log(`Admin requested [${action}] on player ID: ${playerId}`);
        if (window.NetworkInterface && window.NetworkInterface.isConnected()) {
            window.NetworkInterface.sendAdminAction(action, playerId);
        } else if (window.AnimationSystem) {
            window.AnimationSystem.triggerToast("Action simulated in local offline grid.", "warning");
        }
    }
};

window.PlayerEngine = PlayerEngine;
