/**
 * VIVIDSCRIBE VOLATILE & NON-VOLATILE DATA MANAGEMENT CORE
 * Handles localStorage persistence, profile synchronization, and session fallback states.
 */

const StorageEngine = {
    PREFIX: "vividscribe_",

    /**
     * Commits a key-value pair to localStorage with namespace protection
     * @param {string} key 
     * @param {any} value 
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.PREFIX + key, serialized);
            return true;
        } catch (e) {
            console.error("StorageEngine Write Fault Error:", e);
            return false;
        }
    },

    /**
     * Reads a value from namespaced localStorage with type conversion safety
     * @param {string} key 
     * @param {any} defaultValue 
     * @returns {any} Cached value or default fallback parameter
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error("StorageEngine Read Fault Error:", e);
            return defaultValue;
        }
    },

    /**
     * Purges namespaced parameter fields from persistent caching structures
     * @param {string} key 
     */
    remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Serializes player configuration schema state parameters to client cash layout
     * @param {Object} identityData Nickname, Hue value, Token data structures
     */
    saveIdentityProfile(identityData) {
        this.set("identity_profile", {
            nickname: identityData.nickname || "",
            avatarHue: identityData.avatarHue !== undefined ? identityData.avatarHue : 240,
            reconnectToken: identityData.reconnectToken || null,
            language: identityData.language || "en"
        });
    },

    /**
     * Reads current cached user credentials profile metrics matching runtime
     * @returns {Object} User identity object details structure template
     */
    getIdentityProfile() {
        return this.get("identity_profile", {
            nickname: "Operative_" + Math.floor(1000 + Math.random() * 9000),
            avatarHue: Math.floor(Math.random() * 360),
            reconnectToken: null,
            language: "en"
        });
    }
};

window.StorageEngine = StorageEngine;
