/**
 * VIVIDSCRIBE REAL-TIME CHAT & MESSAGING ENGINE
 * চ্যাট মেসেজ ফিড, সিস্টেম অ্যালার্ট, ইমোজি ম্যাক্রো ট্রেই এবং টাইপিং ইন্ডিকেটর হ্যান্ডেল করে।
 */

const ChatEngine = {
    /**
     * চ্যাট ইনপুট, ইমোজি প্যানেল এবং ফর্ম সাবমিশন ইভেন্ট লিসেনার সেটআপ করে
     */
    initialize() {
        this.bindChatInputEvents();
    },

    /**
     * চ্যাট ফিডের সমস্ত ইন্টারঅ্যাকশন লিসেনার বাইন্ড করা
     */
    bindChatInputEvents() {
        const form = document.getElementById("form-chat-input-row");
        const input = document.getElementById("input-chat-message");
        const btnEmoji = document.getElementById("btn-trigger-emoji-macro");
        const trayEmoji = document.getElementById("tray-emoji-macro");

        if (form && input) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const text = input.value.trim();
                if (text) {
                    this.dispatchLocalMessage(text);
                    input.value = "";
                }
            });

            // টাইপিং ইন্ডিকেটর ট্রিগার করার জন্য ইনপুট লিসেনার
            input.addEventListener("input", window.Utils ? window.Utils.debounce(() => {
                this.broadcastTypingState(false);
            }, 1500) : null);

            input.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") {
                    this.broadcastTypingState(true);
                }
            });
        }

        // ইমোজি ট্রেই প্যানেল টগল লজিক
        if (btnEmoji && trayEmoji) {
            btnEmoji.addEventListener("click", (e) => {
                e.stopPropagation();
                trayEmoji.classList.toggle("hidden");
            });

            // ইমোজি ট্রেই এর বাইরের যেকোনো জায়গায় ক্লিক করলে প্যানেল হাইড হবে
            window.addEventListener("click", () => {
                trayEmoji.classList.add("hidden");
            });

            // ইমোজি ম্যাক্রো আইটেম ক্লিক ইভেন্ট
            const emojis = trayEmoji.querySelectorAll(".emoji-macro-item");
            emojis.forEach(emoji => {
                emoji.addEventListener("click", (e) => {
                    if (input) {
                        input.value += e.target.textContent;
                        input.focus();
                    }
                });
            });
        }
    },

    /**
     * চ্যাট বক্সে মেসেজ টাইপ করার পর তা স্ক্রিনে যোগ এবং নেটওয়ার্কে ব্রডকাস্ট করে
     * @param {string} text - মেসেজের বডি
     */
    dispatchLocalMessage(text) {
        const myProfile = window.PlayerEngine ? window.PlayerEngine.localProfile : { nickname: "You" };
        
        // কারেন্ট মেসেজটি চ্যাট স্ক্রিনে রেন্ডার করা
        this.pushMessageToStream(myProfile.nickname, text, "user");

        // টাইপিং ইন্ডিকেটর বন্ধ করা
        this.broadcastTypingState(false);

        // মাল্টিপ্লেয়ার নেটওয়ার্ক আর্কিটেকচার থাকলে সেখানে মেসেজ পাঠানো
        if (window.NetworkInterface && window.NetworkInterface.isConnected()) {
            window.NetworkInterface.sendChatMessage(text);
        } else {
            // যদি অফলাইন মোড হয় এবং প্লেয়ার সঠিক শব্দ অনুমান করার চেষ্টা করে
            if (window.WordSelectionEngine && typeof window.WordSelectionEngine.verifyOfflineGuess === "function") {
                window.WordSelectionEngine.verifyOfflineGuess(text);
            }
        }
    },

    /**
     * চ্যাট উইন্ডোর ভিউপোর্টে ডাইনামিকালি নতুন মেসেজ কার্ড পুশ করে
     * @param {string} author - মেসেজ দাতার নাম (সিস্টেম হলে ফাকা থাকবে)
     * @param {string} text - মেসেজের বডি
     * @param {string} type - মেসেজের ক্যাটাগরি ('user', 'system', 'correct', 'close')
     */
    pushMessageToStream(author, text, type = "user") {
        const viewport = document.getElementById("chat-viewport-stream");
        if (!viewport) return;

        const msgRow = document.createElement("div");
        msgRow.className = `chat-msg-row type-${type}`;

        const sanitizedText = window.Utils ? window.Utils.sanitizeInput(text) : text;

        if (type === "user") {
            const sanitizedAuthor = window.Utils ? window.Utils.sanitizeInput(author) : author;
            msgRow.innerHTML = `<span class="chat-msg-author">${sanitizedAuthor}:</span><span class="chat-msg-body">${sanitizedText}</span>`;
        } else {
            // সিস্টেম, কারেক্ট অ্যান্সার বা ক্লোজ অনুমানের জন্য স্পেশাল মেসেজ বয়লারপ্লেট
            msgRow.innerHTML = `<span class="chat-msg-body">${sanitizedText}</span>`;
        }

        viewport.appendChild(msgRow);

        // স্ক্রলবার অটোমেটিক একদম নিচে নামিয়ে দেওয়া নতুন মেসেজ দেখার জন্য
        viewport.scrollTop = viewport.scrollHeight;
    },

    /**
     * চ্যাট উইন্ডোর টপে টাইপিং ডট অ্যানিমেশন ইন্ডিকেটর কন্ট্রোল করে
     * @param {boolean} isTyping - ইন্ডিকেটর দেখাবে নাকি লুকাবে
     */
    toggleTypingIndicator(isTyping) {
        const indicator = document.getElementById("ui-typing-matrix");
        if (!indicator) return;

        if (isTyping) {
            indicator.classList.remove("invisible");
        } else {
            indicator.classList.add("invisible");
        }
    },

    /**
     * নেটওয়ার্ক সকেটের মাধ্যমে অন্য প্লেয়ারদের কাছে টাইপিং স্টেট ব্রডকাস্ট করার হুক
     */
    broadcastTypingState(isTyping) {
        if (window.NetworkInterface && window.NetworkInterface.isConnected()) {
            window.NetworkInterface.sendTypingState(isTyping);
        }
    }
};

window.ChatEngine = ChatEngine;
