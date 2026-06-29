// --- ফায়ারবেস আসল কনফিগারেশন সেটআপ ---
const firebaseConfig = {
    apiKey: "AIzaSyC4BAf6Ave53GAt5nsQZUgFqDkM7WnfTz8",
    authDomain: "sketch-4668f.firebaseapp.com",
    databaseURL: "https://sketch-4668f-default-rtdb.firebaseio.com",
    projectId: "sketch-4668f",
    storageBucket: "sketch-4668f.firebasestorage.app",
    messagingSenderId: "374735859440",
    appId: "1:374735859440:web:77fc8b9f7753641db29c35"
};

// ফায়ারবেস ইনিশিয়ালাইজ করা
if (typeof firebase !== 'undefined') {
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
        console.log("Firebase Network Interface Armed.");
        if (window.PlayerEngine) {
            this.localPlayerId = window.PlayerEngine.localProfile.id || "p_" + Math.random().toString(36).substr(2, 9);
        }
    },

    connectToRoom(roomCode) {
        if (typeof firebase === 'undefined') {
            console.error("Firebase library not loaded!");
            return;
        }

        this.currentRoomCode = roomCode;
        this.db = firebase.database();
        
        this.roomRef = this.db.ref(`rooms/${roomCode}/players`);
        this.canvasRef = this.db.ref(`rooms/${roomCode}/canvas`);
        this.chatRef = this.db.ref(`rooms/${roomCode}/messages`);
        this.typingRef = this.db.ref(`rooms/${roomCode}/typing`);

        this.connectionStatus = true;
        this.syncLocalPlayerToRoster();
        this.listenToFirebaseEvents();

        if (window.AnimationSystem) {
            window.AnimationSystem.triggerToast(`Connected to Firebase Room: ${roomCode}`, "success");
        }
    },

    syncLocalPlayerToRoster() {
        if (!this.roomRef) return;
        const profile = window.PlayerEngine ? window.PlayerEngine.localProfile : {};
        
        this.roomRef.child(this.localPlayerId).set({
            id: this.localPlayerId,
            nickname: profile.nickname || "Unknown Player",
            avatarHue: profile.avatarHue || 0,
            score: profile.score || 0,
            isHost: profile.isHost || false,
            isDrawing: profile.isDrawing || false,
            hasGuessed: profile.hasGuessed || false
        });

        this.roomRef.child(this.localPlayerId).onDisconnect().remove();
    },

    listenToFirebaseEvents() {
        this.roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && window.PlayerEngine) {
                const playersArray = Object.values(data);
                window.PlayerEngine.renderRoster(playersArray);
            }
        });

        this.canvasRef.on('value', (snapshot) => {
            const dataUrl = snapshot.val();
            if (dataUrl && window.PlayerEngine) {
                if (!window.PlayerEngine.localProfile.isDrawing) {
                    const img = new Image();
                    img.src = dataUrl;
                    img.onload = () => {
                        const ctx = window.CanvasEngine.ctx;
                        const canvas = window.CanvasEngine.canvas;
                        if (ctx && canvas) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
                        }
                    };
                }
            }
        });

        this.chatRef.limitToLast(1).on('child_added', (snapshot) => {
            const packet = snapshot.val();
            if (packet && window.ChatEngine) {
                if (packet.senderId !== this.localPlayerId) {
                    window.ChatEngine.pushMessageToStream(packet.author, packet.text, packet.context);
                }
            }
        });

        this.typingRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (window.ChatEngine) {
                let someoneElseIsTyping = false;
                if (data) {
                    Object.keys(data).forEach(id => {
                        if (id !== this.localPlayerId && data[id] === true) {
                            someoneElseIsTyping = true;
                        }
                    });
                }
                window.ChatEngine.toggleTypingIndicator(someoneElseIsTyping);
            }
        });
    },

    sendCanvasSync(dataUrl) {
        if (this.canvasRef && this.connectionStatus) {
            this.canvasRef.set(dataUrl);
        }
    },

    sendChatMessage(text) {
        if (this.chatRef && this.connectionStatus) {
            const profile = window.PlayerEngine ? window.PlayerEngine.localProfile : {};
            this.chatRef.push({
                senderId: this.localPlayerId,
                author: profile.nickname,
                text: text,
                context: "user"
            });
        }
    },

    sendTypingState(isTyping) {
        if (this.typingRef && this.connectionStatus) {
            if (isTyping) {
                this.typingRef.child(this.localPlayerId).set(true);
            } else {
                this.typingRef.child(this.localPlayerId).remove();
            }
        }
    },

    sendAdminAction(action, playerId) {
        if (action === 'kick' && this.roomRef && this.connectionStatus) {
            this.roomRef.child(playerId).remove();
        }
    },

    disconnectFromRoom() {
        if (this.roomRef) {
            this.roomRef.child(this.localPlayerId).remove();
            this.roomRef.off();
        }
        if (this.canvasRef) this.canvasRef.off();
        if (this.chatRef) this.chatRef.off();
        if (this.typingRef) this.typingRef.off();

        this.connectionStatus = false;
        this.currentRoomCode = null;
        console.log("Disconnected from Firebase.");
    },

    isConnected() {
        return this.connectionStatus;
    }
};

window.NetworkInterface = NetworkInterface;
