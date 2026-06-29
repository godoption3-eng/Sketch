/**
 * VIVIDSCRIBE MOBILE & TOUCH OPTIMIZATION ENGINE
 * মোবাইল ডিভাইসের টাচ রেসপন্স এবং রেসপন্সিভ ভিউ পোর্ট লেআউট ম্যানেজ করে।
 */

const MobileAdapter = {
    state: {
        isTouchDevice: false,
        activeMobileTab: 'canvas' // 'canvas', 'roster', 'chat'
    },

    /**
     * মোবাইল অ্যাডাপ্টার ইনিশিয়ালাইজ এবং ইভেন্ট লিসেনার সেটআপ
     */
    initialize() {
        this.checkForTouchSupport();
        this.bindOrientationEvents();
        this.setupMobileNavigationStub();
    },

    /**
     * ডিভাইসটিতে টাচ স্ক্রিন সাপোর্ট আছে কি না তা ডিটেক্ট করে
     */
    checkForTouchSupport() {
        this.state.isTouchDevice = ('ontouchstart' in window) || 
                                   (navigator.maxTouchPoints > 0) || 
                                   (navigator.msMaxTouchPoints > 0);
        
        if (this.state.isTouchDevice) {
            document.body.classList.add('touch-optimized-ui');
        }
    },

    /**
     * মোবাইল বা ট্যাবলেটের স্ক্রিন ঘোরানো (Orientation Change) হ্যান্ডেল করে
     */
    bindOrientationEvents() {
        window.addEventListener('resize', window.Utils ? window.Utils.debounce(() => {
            this.recalculateCanvasViewBounds();
        }, 200) : () => this.recalculateCanvasViewBounds());
    },

    /**
     * ছোট স্ক্রিনের ডিভাইসে ক্যানভাসের সাইজ ঠিকঠাক রি-ম্যাপ করার লজিক
     */
    recalculateCanvasViewBounds() {
        if (window.CanvasEngine && typeof window.CanvasEngine.adaptSizeBounds === 'function') {
            window.CanvasEngine.adaptSizeBounds();
        }
    },

    /**
     * মোবাইল ভিউতে ইউজার ইন্টারফেসের বিভিন্ন ট্যাব বা সেকশন নেভিগেশন কন্ট্রোল
     */
    setupMobileNavigationStub() {
        // ছোট স্ক্রিনে ভিউ প্যানেল ট্রানজিশনের জন্য ইন্টারনাল হুক
        if (window.innerWidth <= 768) {
            console.log("Mobile View Architecture Active.");
        }
    }
};

// গ্লোবাল উইন্ডো অবজেক্টে এক্সপোর্ট করা হলো
window.MobileAdapter = MobileAdapter;
