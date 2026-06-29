/**
 * VIVIDSCRIBE UTILITY MATRIX & REVENUE-GRADE PERFORMANCE HELPERS
 * Core Engineering: Math optimizers, cryptographic secure tokens, input sanitizers.
 */

const Utils = {
    /**
     * Generates a high-entropy room token matching the split format XXXX-XXXX-XXXX
     * @returns {string} Fully formed room token
     */
    generateSecureToken() {
        const segments = [];
        const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous characters
        for (let i = 0; i < 3; i++) {
            let seg = "";
            for (let j = 0; j < 4; j++) {
                const randIndex = Math.floor(Math.random() * alphabet.length);
                seg += alphabet.charAt(randIndex);
            }
            segments.push(seg);
        }
        return segments.join("-");
    },

    /**
     * Rigid verification for incoming user input strings to isolate potential cross-site injections
     * @param {string} rawString 
     * @returns {string} Sanitized alpha-numeric output escape string
     */
    sanitizeInput(rawString) {
        if (typeof rawString !== 'string') return '';
        return rawString
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;")
            .replace(/\//g, "&#x2F;");
    },

    /**
     * High-speed calculation of continuous Euclidean space dimensions
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     * @returns {number} Scalar floating point distance metrics
     */
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    /**
     * Execution throttler / Debouncer to curb UI pipeline floodings on intensive events
     * @param {Function} callback Target callback pipeline
     * @param {number} delay Timeout parameter in ms
     * @returns {Function} Context wrapper execution proxy
     */
    debounce(callback, delay) {
        let timer;
        return function (...args) {
            const context = this;
            clearTimeout(timer);
            timer = setTimeout(() => {
                callback.apply(context, args);
            }, delay);
        };
    },

    /**
     * Maps an input scalar from one domain space into another range bound accurately
     * @param {number} value 
     * @param {number} istart 
     * @param {number} istop 
     * @param {number} ostart 
     * @param {number} ostop 
     * @returns {number} Calibrated float parameter
     */
    mapRange(value, istart, istop, ostart, ostop) {
        return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
    }
};

// Export to globally accessible namespace framework safely
window.Utils = Utils;
