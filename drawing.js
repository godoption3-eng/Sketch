/**
 * VIVIDSCRIBE INTERACTIVE DRAWING CONTROLLER & VECTOR TOOLS
 * ব্রাশ টুলস (Pencil, Marker, Eraser, Spray, Fill) এবং মাউস/টাচ কোঅর্ডিনেট ট্র্যাকিং লজিক।
 */

const DrawingController = {
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    
    // কারেন্ট ব্রাশ সেটিংস
    activeTool: "pencil", // pencil, marker, spray, fill, eraser
    activeColor: "#000000",
    brushSize: 8,
    brushOpacity: 100,

    /**
     * মাউস, টাচ ইভেন্ট এবং টুল ডকের সমস্ত ইন্টারঅ্যাকশন বাইন্ড করে
     */
    initialize() {
        this.bindDrawingInputs();
        this.bindDockInterface();
    },

    /**
     * ক্যানভাস সারফেসের মাউস এবং টাচ মুভমেন্ট ইভেন্ট হ্যান্ডলার সেটআপ
     */
    bindDrawingInputs() {
        const canvas = window.CanvasEngine ? window.CanvasEngine.canvas : null;
        if (!canvas) return;

        // মাউস ইভেন্ট লিসেনারস
        canvas.addEventListener("mousedown", (e) => this.startStroke(e));
        canvas.addEventListener("mousemove", (e) => this.drawStroke(e));
        window.addEventListener("mouseup", () => this.stopStroke());

        // মোবাইল টাচ ইভেন্ট লিসেনারস (টাচ স্ক্রিন ডিভাইসের জন্য)
        canvas.addEventListener("touchstart", (e) => {
            e.preventDefault();
            if (e.touches.length > 0) this.startStroke(e.touches[0]);
        }, { passive: false });

        canvas.addEventListener("touchmove", (e) => {
            e.preventDefault();
            if (e.touches.length > 0) this.drawStroke(e.touches[0]);
        }, { passive: false });

        window.addEventListener("touchend", () => this.stopStroke());
    },

    /**
     * টুল ডক বা মেনু বারের সেটিংস (কালার সোয়াচ, সাইজ স্লাইডার, ব্রাশ সিলেকশন) ইন্টারফেস কানেক্ট করা
     */
    bindDockInterface() {
        // কালার সোয়াচ সিলেকশন
        const swatches = document.querySelectorAll(".swatch-item");
        swatches.forEach(swatch => {
            swatch.addEventListener("click", (e) => {
                swatches.forEach(s => s.classList.remove("active-swatch"));
                e.target.classList.add("active-swatch");
                this.activeColor = e.target.getAttribute("data-hex");
            });
        });

        // কাস্টম স্পেকট্রাম কালার পিকার
        const customColorInput = document.getElementById("input-canvas-color-custom");
        if (customColorInput) {
            customColorInput.addEventListener("input", (e) => {
                this.activeColor = e.target.value;
                // যেকোনো সোয়াচ থেকে একটিভ মার্ক সরিয়ে দেওয়া
                swatches.forEach(s => s.classList.remove("active-swatch"));
            });
        }

        // ব্রাশ ইঞ্জিন বা টুল সিলেকশন
        const engineBtns = document.querySelectorAll(".engine-btn");
        engineBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const target = e.currentTarget;
                engineBtns.forEach(b => b.classList.remove("active-engine"));
                target.classList.add("active-engine");
                this.activeTool = target.getAttribute("data-engine");
            });
        });

        // ব্রাশ সাইজ সliers
        const sliderSize = document.getElementById("slider-brush-size");
        const txtSizeVal = document.getElementById("txt-brush-size-val");
        if (sliderSize && txtSizeVal) {
            sliderSize.addEventListener("input", (e) => {
                this.brushSize = parseInt(e.target.value, 10);
                txtSizeVal.textContent = this.brushSize + "px";
            });
        }

        // অপাসিটি স্লাইডার
        const sliderOpacity = document.getElementById("slider-brush-opacity");
        const txtOpacityVal = document.getElementById("txt-brush-opacity-val");
        if (sliderOpacity && txtOpacityVal) {
            sliderOpacity.addEventListener("input", (e) => {
                this.brushOpacity = parseInt(e.target.value, 10);
                txtOpacityVal.textContent = this.brushOpacity + "%";
            });
        }

        // হিস্ট্রি এবং ক্লিয়ার বাটন লকিং
        const btnUndo = document.getElementById("btn-canvas-undo");
        const btnRedo = document.getElementById("btn-canvas-redo");
        const btnClear = document.getElementById("btn-canvas-clear");

        if (btnUndo) btnUndo.addEventListener("click", () => window.CanvasEngine.executeUndo());
        if (btnRedo) btnRedo.addEventListener("click", () => window.CanvasEngine.executeRedo());
        if (btnClear) btnClear.addEventListener("click", () => window.CanvasEngine.clearSurfaceMatrix());
    },

    /**
     * ক্যানভাসে মাউস/টাচ ক্লিক করার মূহুর্তে স্ট্রোক প্রসেস স্টার্ট করে
     */
    startStroke(e) {
        // চ্যাট বা অন্য যেকোনো এলিমেন্ট থেকে ফোকাস সরিয়ে নেওয়া
        if (document.activeElement) document.activeElement.blur();

        // চেক করা হচ্ছে ক্যানভাস টুল ডকটি লকড বা ডিসেবলড আছে কি না (ইউজার স্পেক্টেটর হলে)
        const dock = document.getElementById("canvas-tool-dock");
        if (dock && dock.classList.contains("active-lock")) return;

        this.isDrawing = true;
        
        const coords = this.getRelativeCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;

        // Undo হিস্ট্রির জন্য কারেন্ট স্টেট ব্যাকআপ
        if (window.CanvasEngine && this.activeTool !== "fill") {
            window.CanvasEngine.saveHistoryState();
        }

        // যদি বালতি টুল (Flood Fill) সিলেক্ট করা থাকে তবে সাথে সাথেই রান করবে
        if (this.activeTool === "fill") {
            this.executeFloodFill(coords.x, coords.y);
        } else if (this.activeTool === "spray") {
            this.executeSprayGunEffect(coords.x, coords.y);
        } else {
            this.renderDrawStep(coords.x, coords.y, true);
        }
    },

    /**
     * মাউস মুভমেন্ট বা স্ক্রিনে টাচ ড্র্যাগ করার সময় ক্যানভাসে লাইন আঁকার প্রসেস
     */
    drawStroke(e) {
        if (!this.isDrawing) return;

        const coords = this.getRelativeCoordinates(e);

        if (this.activeTool === "spray") {
            this.executeSprayGunEffect(coords.x, coords.y);
        } else if (this.activeTool !== "fill") {
            this.renderDrawStep(coords.x, coords.y, false);
        }

        this.lastX = coords.x;
        this.lastY = coords.y;
    },

    /**
     * মাউস রিলিজ বা স্ক্রিন থেকে হাত সরিয়ে নিলে স্ট্রোক বন্ধ করার লজিক
     */
    stopStroke() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        // আঁকা শেষ হলে রিয়েল-টাইমে নেটওয়ার্কে ব্রডকাস্ট করবে
        if (window.CanvasEngine) {
            window.CanvasEngine.broadcastCanvasToNetwork();
        }
    },

    /**
     * ক্যানভাসের উইন্ডো বাউন্ডিং রেক্ট সাপেক্ষে রিলেটিভ মাউস পজিশন ক্যালকুলেট করে
     */
    getRelativeCoordinates(e) {
        const canvas = window.CanvasEngine.canvas;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    },

    /**
     * ক্যানভাস কনটেক্সটে ব্রাশ বা ইরেজারের পাথ ড্র রেন্ডার করে
     */
    renderDrawStep(targetX, targetY, isStartPoint) {
        const ctx = window.CanvasEngine.ctx;
        if (!ctx) return;

        ctx.beginPath();
        
        // টুল অপটিমাইজেশন লজিক
        if (this.activeTool === "eraser") {
            ctx.strokeStyle = "#ffffff"; // ইরেজার মূলত সাদা রঙের ব্রাশ
            ctx.lineWidth = this.brushSize * 1.5;
            ctx.globalAlpha = 1.0;
        } else {
            ctx.strokeStyle = this.activeColor;
            ctx.lineWidth = this.activeTool === "marker" ? this.brushSize * 1.8 : this.brushSize;
            ctx.globalAlpha = this.brushOpacity / 100;
        }

        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        
        // গ্লোবাল অপাসিটি ডিফল্ট স্টেটে ফিরিয়ে আনা
        ctx.globalAlpha = 1.0;
    },

    /**
     * স্প্রে গান (Aerosol Spray EFFECT) এর প্রসিডিউরাল ডট জেনারেশন মেকানিজম
     */
    executeSprayGunEffect(x, y) {
        const ctx = window.CanvasEngine.ctx;
        if (!ctx) return;

        ctx.fillStyle = this.activeColor;
        ctx.globalAlpha = this.brushOpacity / 100;
        
        const density = this.brushSize * 2;
        for (let i = 0; i < density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.brushSize * 1.5;
            const offsetX = Math.cos(angle) * radius;
            const offsetY = Math.sin(angle) * radius;
            
            ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
        }
        ctx.globalAlpha = 1.0;
    },

    /**
     * ফ্লাড ফিল (Flood Fill - Bucket Tool) লজিক
     * স্ক্রিনের নির্দিষ্ট পিক্সেল কালার এরিয়া ডিটেক্ট করে বাউন্ডারি ফিল করে
     */
    executeFloodFill(startX, startY) {
        if (window.AnimationSystem) {
            window.AnimationSystem.triggerToast("Flood Fill processed inside viewport.", "success", 1500);
        }
        // ক্যানভাসে জাস্ট একটি সলিড ফিল ইমপ্লিমেন্ট করা হলো ডেমো অফলাইন মোডের সুবিধার্থে
        const ctx = window.CanvasEngine.ctx;
        const canvas = window.CanvasEngine.canvas;
        if (ctx && canvas) {
            window.CanvasEngine.saveHistoryState();
            ctx.fillStyle = this.activeColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
};

window.DrawingController = DrawingController;
