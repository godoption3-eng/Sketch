/**
 * VIVIDSCRIBE VOCABULARY MATRIX & DICTIONARY CONTROLLER
 * শব্দ ভান্ডার (Word Pool), গোপন শব্দের ড্যাশ হিন্ট জেনারেশন এবং অনুমান ভ্যালিডেশন হ্যান্ডেল করে।
 */

const WordSelectionEngine = {
    // ডিফল্ট সিক্রেট শব্দ ভান্ডার ডেটাবেজ পুলে বিভিন্ন ক্যাটাগরি ম্যাট্রিক্স
    wordDatabase: {
        easy: ["cat", "house", "sun", "tree", "car", "apple", "book", "fish", "ball", "key"],
        medium: ["cyberpunk", "mainframe", "telemetry", "singularity", "spaceship", "quantum", "gravity", "volcano", "pyramid", "wizard"],
        hard: ["cryptography", "photosynthesis", "thermodynamics", "microprocessor", "metamorphosis", "procrastination", "synchronization"]
    },
    
    currentSecretWord: "",
    revealedHintPattern: "",

    /**
     * ডিফিকাল্টি ক্যাটাগরি অনুযায়ী শব্দ নির্বাচন বা চয়েস লিস্ট তৈরি করে দেয়
     * @param {string} difficulty - 'easy', 'medium', বা 'hard'
     * @returns {Array} ৩টি র্যান্ডম শব্দের অ্যারে
     */
    generateWordChoices(difficulty = "medium") {
        const pool = this.wordDatabase[difficulty] || this.wordDatabase.medium;
        
        // কাস্টম শব্দ অ্যাড করা থাকলে তা পুলে ইনজেক্ট করা
        let activePool = [...pool];
        if (window.SystemSettings && window.SystemSettings.state.customWords.length > 0) {
            activePool = [...activePool, ...window.SystemSettings.state.customWords];
        }

        // র্যান্ডম ৩টি ইউনিক শব্দ বাছাই করার অ্যালগরিদম
        const shuffled = activePool.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    },

    /**
     * ড্রয়ার কোনো শব্দ সিলেক্ট করলে বা সিস্টেম থেকে শব্দ অ্যাসাইন হলে গোপন হিন্ট ড্যাশ প্যাটার্ন তৈরি করে
     * @param {string} word - আসল শব্দ
     */
    setSecretWord(word) {
        this.currentSecretWord = word.toLowerCase().trim();
        
        // অক্ষরের জায়গায় '_' এবং স্পেসের জায়গায় স্পেস রেখে হিন্ট তৈরি করা
        this.revealedHintPattern = this.currentSecretWord
            .split("")
            .map(char => char === " " ? " " : "_")
            .join("");

        this.updateSecretDisplayUI(false); // অন্য প্লেয়ারদের জন্য ড্যাশ দেখাবে
    },

    /**
     * গেম এরিনার সেন্ট্রাল ড্যাশবোর্ডে গোপন শব্দের হিন্ট বা আসল শব্দ ডিসপ্লে করে
     * @param {boolean} revealFully - true হলে সম্পূর্ণ শব্দ দেখাবে (ড্রয়ারের জন্য বা রাউন্ড শেষে)
     */
    updateSecretDisplayUI(revealFully = false) {
        const displayElement = document.getElementById("txt-dashboard-prompt-word");
        if (!displayElement) return;

        if (revealFully) {
            displayElement.textContent = this.currentSecretWord.toUpperCase();
            displayElement.style.letterSpacing = "2px";
        } else {
            // অন্য প্লেয়ারদের জন্য ড্যাশ ফরম্যাট (`_ _ _ _`) সুন্দরভাবে স্পেস দিয়ে রি-ম্যাপ করা
            displayElement.textContent = this.revealedHintPattern.split("").join(" ");
            displayElement.style.letterSpacing = "6px";
        }
    },

    /**
     * সিঙ্গেল প্লেয়ার বা অফলাইন প্র্যাকটিস মোডে ইউজারের চ্যাট অনুমান সঠিক কি না তা চেক করে
     * @param {string} guessText - ইউজারের টাইপ করা অনুমান
     */
    verifyOfflineGuess(guessText) {
        if (!this.currentSecretWord) return;

        const cleanGuess = guessText.toLowerCase().trim();

        if (cleanGuess === this.currentSecretWord) {
            if (window.ChatEngine) {
                window.ChatEngine.pushMessageToStream("SYSTEM", `🎯 Congratulations! You guessed the word: [${this.currentSecretWord.toUpperCase()}]`, "correct");
            }
            this.updateSecretDisplayUI(true); // সঠিক অনুমান হলে শব্দ রিভিল করা
            
            if (window.AnimationSystem) {
                window.AnimationSystem.triggerToast("Correct Answer Matrix Decrypted!", "success");
            }
        } else {
            // আংশিক মিল বা ক্লোজ অনুমান চেক করা (যদি মাত্র ১টি অক্ষর ভুল হয়)
            if (this.isGuessClose(cleanGuess, this.currentSecretWord)) {
                if (window.ChatEngine) {
                    window.ChatEngine.pushMessageToStream("SYSTEM", `⚠️ "${guessText}" is very close!`, "close");
                }
            }
        }
    },

    /**
     * লিভেনশটাইন বা ডিসটেন্স লজিক ব্যবহার করে অনুমানটি আসল শব্দের খুব কাছাকাছি কি না তা পরিমাপ করে
     */
    isGuessClose(guess, target) {
        if (Math.abs(guess.length - target.length) > 1) return false;
        
        let mistakes = 0;
        let i = 0, j = 0;
        
        while (i < guess.length && j < target.length) {
            if (guess[i] !== target[j]) {
                mistakes++;
                if (guess.length > target.length) i++;
                else if (guess.length < target.length) j++;
                else { i++; j++; }
            } else {
                i++; j++;
            }
        }
        
        mistakes += (guess.length - i) + (target.length - j);
        return mistakes === 1; // যদি মাত্র ১টি অক্ষরের অমিল থাকে তবে ক্লোজ ধরবে
    }
};

window.WordSelectionEngine = WordSelectionEngine;
