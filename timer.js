/**
 * VIVIDSCRIBE CENTRAL TIMER & CLOCK COUNTDOWN ENGINE
 * গেমের রাউন্ডের সময়সীমা ট্র্যাকিং এবং ড্যাশবোর্ড প্রম্পট ক্লক ডিসপ্লে কন্ট্রোল করে।
 */

const CountdownTimer = {
    timerIntervalId: null,
    timeRemaining: 0,
    totalDuration: 60,

    /**
     * টাইমার মডিউল ইনিশিয়ালাইজ করে এবং ডিফল্ট স্টেট কনফিগার করে
     */
    initialize() {
        this.resetTimerUI();
    },

    /**
     * একটি নতুন কাউন্টডাউন সিকোয়েন্স স্টার্ট করে
     * @param {number} seconds - কত সেকেন্ডের টাইমার সেট হবে
     * @param {Function} onTickCallback - প্রতি সেকেন্ডে যে ফাংশনটি রান করবে (ঐচ্ছিক)
     * @param {Function} onCompleteCallback - সময় শেষ হলে যে ফাংশনটি রান করবে
     */
    start(seconds, onTickCallback = null, onCompleteCallback = null) {
        this.stop(); // পূর্বে কোনো রানিং টাইমার থাকলে তা ক্লিয়ার করা

        this.totalDuration = seconds;
        this.timeRemaining = seconds;
        this.updateTimerUI();

        this.timerIntervalId = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerUI();

            if (onTickCallback) {
                onTickCallback(this.timeRemaining);
            }

            // সময় শেষ হয়ে যাওয়ার অ্যালগরিদম ট্রিগার
            if (this.timeRemaining <= 0) {
                this.stop();
                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }
        }, 1000);
    },

    /**
     * চলমান কাউন্টডাউন টাইমার চিরতরে থামিয়ে দেয়
     */
    stop() {
        if (this.timerIntervalId) {
            clearInterval(this.timerIntervalId);
            this.timerIntervalId = null;
        }
    },

    /**
     * ড্যাশবোর্ডের ক্লক প্যানেলে এবং SVG প্রোগ্রেস সার্কেলে ডেটা রেন্ডার করে
     */
    updateTimerUI() {
        const txtClock = document.getElementById("txt-dashboard-clock");
        const progressRing = document.getElementById("svg-timer-progress-ring");

        if (txtClock) {
            txtClock.textContent = this.timeRemaining;
        }

        // SVG রিংয়ের ড্যাশবোর্ড অ্যানিমেশন রেন্ডারিং লজিক (CSS Stroke Dashoffset)
        if (progressRing) {
            const radius = 18; // SVG Circle এর ব্যাসার্ধ
            const circumference = 2 * Math.PI * radius; // ২ * পাই * আর
            const percentage = this.timeRemaining / this.totalDuration;
            const offset = circumference - (percentage * circumference);
            
            progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
            progressRing.style.strokeDashoffset = offset;

            // সময় ১০ সেকেন্ডের কম থাকলে টাইমার রিং লাল রঙে হাইলাইট করার ট্রিক
            if (this.timeRemaining <= 10) {
                progressRing.style.stroke = "var(--accent-error)";
            } else {
                progressRing.style.stroke = "var(--accent-primary)";
            }
        }
    },

    /**
     * টাইমার ইন্টারফেসকে শুরুর বা ব্ল্যাঙ্ক স্টেটে নিয়ে যায়
     */
    resetTimerUI() {
        this.stop();
        const txtClock = document.getElementById("txt-dashboard-clock");
        if (txtClock) txtClock.textContent = "--";
    }
};

window.CountdownTimer = CountdownTimer;
