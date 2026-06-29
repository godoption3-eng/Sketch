/**
 * VIVIDSCRIBE ANIMATION & CORE VISUAL EFFECTS ENGINE
 * UI ট্রানজিশন, কাস্টম নোটিফিকেশন টোস্ট (Toasts) এবং গেম স্ক্রিন ওভারলে ম্যানেজ করে।
 */

const AnimationSystem = {
    /**
     * স্ক্রিনে একটি কাস্টম নোটিফিকেশন (Toast Alert) দেখায়
     * @param {string} message - যে মেসেজটি দেখাতে চান
     * @param {string} context - 'success', 'warning', বা 'error'
     * @param {number} duration - কতক্ষণ স্ক্রিনে থাকবে (milliseconds)
     */
    triggerToast(message, context = 'success', duration = 4000) {
        let toastContainer = document.getElementById('toast-container');
        
        // যদি টোস্ট কন্টেইনার না থাকে, নতুন তৈরি করবে
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-layer';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast-message ${context}-context`;
        
        // নোটিফিকেশনের টাইপ অনুযায়ী আইকন সেট করা
        let icon = '💡';
        if (context === 'success') icon = '🎯';
        if (context === 'warning') icon = '⚠️';
        if (context === 'error') icon = '🛑';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-text">${window.Utils ? window.Utils.sanitizeInput(message) : message}</span>
        `;

        toastContainer.appendChild(toast);

        // নির্দিষ্ট সময় পর টোস্টটি অ্যানিমেশন সহ রিমুভ করার লজিক
        setTimeout(() => {
            toast.classList.add('toast-exit');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, duration);
    },

    /**
     * গেমের ক্যানভাসের উপর বিভিন্ন নোটিশ বা ওভারলে স্ক্রিন দেখায় (যেমন: "ROUND OVER", "CHOOSE A WORD")
     * @param {string} screenId - ওয়ান্টেড মোডাল এলিমেন্টের আইডি ('modal-word-picker' বা 'modal-round-summary')
     * @param {boolean} show - true হলে দেখাবে, false হলে হাইড করবে
     */
    toggleCanvasOverlay(screenId, show) {
        const overlay = document.getElementById('canvas-overlay-screen');
        const targetScreen = document.getElementById(screenId);
        
        if (!overlay) return;

        if (show) {
            overlay.classList.remove('hidden');
            if (targetScreen) targetScreen.classList.remove('hidden');
        } else {
            if (targetScreen) targetScreen.classList.add('hidden');
            
            // চেক করা হচ্ছে অন্য কোনো স্ক্রিন ওপেন আছে কি না, না থাকলে মেইন ওভারলে হাইড হবে
            const activePickers = overlay.querySelectorAll('.picker-dialog:not(.hidden), .summary-dialog:not(.hidden)');
            if (activePickers.length === 0) {
                overlay.classList.add('hidden');
            }
        }
    }
};

window.AnimationSystem = AnimationSystem;
