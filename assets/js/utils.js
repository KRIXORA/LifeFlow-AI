/* Utility Functions */
class Utils {
    static formatDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    }
}
window.Utils = Utils;
