/* Utility Functions */
class Utils {
    static formatDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    }

    static escapeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str || '';
        return temp.innerHTML;
    }

    /** Returns a filename-safe, human-readable date like "2Aug2026-1430" for exports/backups. */
    static fileTimestamp() {
        const d = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getDate()}${months[d.getMonth()]}${d.getFullYear()}-${pad(d.getHours())}${pad(d.getMinutes())}`;
    }
}
window.Utils = Utils;
