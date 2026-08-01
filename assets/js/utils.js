/* Utility Functions */
class Utils {
    static formatDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    }

    static generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
}
window.Utils = Utils;
