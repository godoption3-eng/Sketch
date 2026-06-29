/**
 * VIVIDSCRIBE CORE CANVAS ENGINE & ARCHITECTURE LAYER
 * ক্যানভাস সারফেস ইনিশিয়ালাইজেশন, হাই-ডিপিআই স্কেলিং এবং হিস্ট্রি বাফার (Undo/Redo) কন্ট্রোল করে।
 */

const CanvasEngine = {
    canvas: null,
    ctx: null,
    undoStack: [],
    redoStack: [],
    maxStackSize: 20,

    /**
     * ক্যানভাস মডিউল এবং ডিফল্ট কনটেক্সট প্রোপার্টিজ সেটআপ করে
     */
    initialize() {
        this.canvas = document.getElementById("main-drawing-canvas");
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
        
        this.adaptSizeBounds();
        this.resetCanvasToBlank();
        this.syncHistoryButtons();
    },

    /**
     * স্ক্রিনের সাইজ বা ডিপিআই (DPI) অনুযায়ী ক্যানভাসের রেজোলিউশন ঠিক করে (ব্লার হওয়া রোধ করতে)
     */
    adaptSizeBounds() {
        if (!this.canvas || !this.ctx) return;

        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // ব্যাকআপ বর্তমান ক্যানভাস ডেটা ট্রানজিশনের সময় রি-ড্র করার জন্য
        let tempImage = null;
        if (this.canvas.width > 0 && this.canvas.height > 0) {
            tempImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }

        // প্যারেন্ট কন্টেইনারের সাইজ অনুযায়ী ইন্টারনাল রেজোলিউশন স্কেল করা
        this.canvas.width = (rect.width || 600) * dpr;
        this.canvas.height = (rect.height || 450) * dpr;

        // ক্যানভাস কনটেক্সট পুনরায় রিসেট বা স্মুথিং কনফিগার করা
        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = true;

        // ডিফল্ট ড্রয়িং স্টাইল পুনরায় সেট করা
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        // পূর্বের ইমেজ ডেটা থাকলে তা নতুন স্কেলে রি-প্লে করা
        if (tempImage) {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = tempImage.width;
            tempCanvas.height = tempImage.height;
            tempCanvas.getContext("2d").putImageData(tempImage, 0, 0);
            
            this.ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
        } else {
            this.resetCanvasToBlank();
        }
    },

    /**
     * ক্যানভাস পুরো সাদা করে রিসেট করে
     */
    resetCanvasToBlank() {
        if (!this.ctx || !this.canvas) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(0, 0, rect.width, rect.height);
    },

    /**
     * বর্তমান ক্যানভাস স্টেটের একটি স্ন্যাপশট হিস্ট্রি ট্র্যাকিং বাফারে পুশ করে (Undo এর জন্য)
     */
    saveHistoryState() {
        if (!this.ctx || !this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const state = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift(); // পুরনো মেমোরি রিলিজ করা
        }

        // নতুন কিছু ড্র করলে Redo স্ট্যাক ক্লিয়ার হয়ে যায়
        this.redoStack = [];
        this.syncHistoryButtons();
    },

    /**
     * এক ধাপ পেছনে ফিরে যাওয়া (Undo)
     */
    executeUndo() {
        if (this.undoStack.length === 0 || !this.ctx) return;

        const currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.redoStack.push(currentState);

        const previousState = this.undoStack.pop();
        this.ctx.putImageData(previousState, 0, 0);
        
        this.syncHistoryButtons();
        this.broadcastCanvasToNetwork();
    },

    /**
     * এক ধাপ সামনে এগিয়ে যাওয়া (Redo)
     */
    executeRedo() {
        if (this.redoStack.length === 0 || !this.ctx) return;

        const currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.undoStack.push(currentState);

        const nextState = this.redoStack.pop();
        this.ctx.putImageData(nextState, 0, 0);

        this.syncHistoryButtons();
        this.broadcastCanvasToNetwork();
    },

    /**
     * ক্যানভাস সম্পূর্ণ মুছে ফেলার মেকানিজম
     */
    clearSurfaceMatrix() {
        if (!this.ctx) return;
        this.saveHistoryState();
        this.resetCanvasToBlank();
        this.broadcastCanvasToNetwork();
    },

    /**
     * ইন্টারফেসের Undo/Redo বাটনের ডিসেবল/এনেবল স্টেট কন্ট্রোল করা
     */
    syncHistoryButtons() {
        const btnUndo = document.getElementById("btn-canvas-undo");
        const btnRedo = document.getElementById("btn-canvas-redo");

        if (btnUndo) btnUndo.disabled = (this.undoStack.length === 0);
        if (btnRedo) btnRedo.disabled = (this.redoStack.length === 0);
    },

    /**
     * মাল্টিপ্লেয়ার মোডে নেটওয়ার্কের মাধ্যমে অন্য প্লেয়ারদের কাছে ক্যানভাস ডেটা ট্রান্সমিট করার হুক
     */
    broadcastCanvasToNetwork() {
        if (window.NetworkInterface && window.NetworkInterface.isConnected()) {
            const dataUrl = this.canvas.toDataURL("image/webp", 0.5);
            window.NetworkInterface.sendCanvasSync(dataUrl);
        }
    }
};

window.CanvasEngine = CanvasEngine;
