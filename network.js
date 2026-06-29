// --- ফায়ারবেস কনফিগারেশন ---
const firebaseConfig = {
    apiKey: "AIzaSyC4BAf6Ave53GAt5nsQZUgFqDkM7WnfTz8",
    authDomain: "sketch-4668f.firebaseapp.com",
    databaseURL: "https://sketch-4668f-default-rtdb.firebaseio.com",
    projectId: "sketch-4668f",
    storageBucket: "sketch-4668f.firebasestorage.app",
    messagingSenderId: "374735859440",
    appId: "1:374735859440:web:77fc8b9f7753641db29c35"
};

// গেমটি লোড হওয়ার সময় ফায়ারবেস চেক ও ইনিশিয়ালাইজ করা
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const NetworkInterface = {
    db: null,
    roomRef: null,
    canvasRef: null,
    chatRef: null,
    typingRef: null,
    connectionStatus: false,
    currentRoomCode: null,
    localPlayerId: null,

    initialize() {
        console.log("Network Interface: Setting up system identity...");
        // প্লেয়ার প্রোফাইল পাওয়ার চেষ্টা করা
        if (window.PlayerEngine && window.PlayerEngine.localProfile) {
            this.localPlayerId = window.PlayerEngine.localProfile.id || "p_" + Math.random().toString(36).substr(2, 9);
        } else {
            this.localPlayerId = "p_" + Math.random().toString(36).substr(2, 9);
        }
        
        // ফায়ারবেস ডেটাবেস রেফারেন্স সেট করা
        if (typeof firebase !== 'undefined') {
            this.db = firebase.database();
        }
    },

    connectToRoom(roomCode) {
        if (!this.db) {
            console.error("Firebase Database not initialized!");
            return;
        }

        this.currentRoomCode = roomCode;
        this.roomRef = this.db.ref(`rooms/${roomCode}/players`);
        this.canvasRef = this.db.ref(`rooms/${roomCode}/canvas`);
        this.chatRef = this.db.ref(`rooms/${roomCode}/messages`);
        this.typingRef = this.db.ref(`rooms/${roomCode}/typing`);

        this.connectionStatus = true;
        this.syncLocalPlayerToRoster();
        this.listenToFirebaseEvents();

        console.log("Connected to room:", roomCode);
    },

    syncLocalPlayerToRoster() {
        if (!this.roomRef) return;
        const profile = (window.PlayerEngine && window.PlayerEngine.localProfile) ? window.PlayerEngine.localProfile : { nickname: "Player" };
        
        this.roomRef.child(this.localPlayerId).set({
            id: this.localPlayerId,
            nickname: profile.nickname,
            score: profile.score || 0,
            isDrawing: profile.isDrawing || false
        });

        this.roomRef.child(this.localPlayerId).onDisconnect().remove();
    },

    listenToFirebaseEvents() {
        if (!this.roomRef) return;

        // প্লেয়ার আপডেট শোনা
        this.roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && window.PlayerEngine) {
                window.PlayerEngine.renderRoster(Object.values(data));
            }
        });

        // ক্যানভাস আপডেট শোনা
        this.canvasRef.on('value', (snapshot) => {
            const dataUrl = snapshot.val();
            if (dataUrl && window.CanvasEngine && (!window.PlayerEngine || !window.PlayerEngine.localProfile.isDrawing)) {
                const img = new Image();
                img.onload = () => {
                    const ctx = window.CanvasEngine.ctx;
                    ctx.clearRect(0, 0, window.CanvasEngine.canvas.width, window.CanvasEngine.canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = dataUrl;
            }
        });
    },

    sendCanvasSync(dataUrl) {
        if (this.canvasRef && this.connectionStatus) {
            this.canvasRef.set(dataUrl);
        }
    },

    isConnected() {
        return this.connectionStatus;
    }
};

window.NetworkInterface = NetworkInterface;
