/**
 * Storage Manager - Centralized Redux-like Store & Persistent Storage with Schema Validation
 */
class StorageManager {
    static inMemoryStorage = {};
    
    // Default Schemas for Data Validation & Migration
    static SCHEMAS = {
        portfolio_settings: { developerName: 'Architect Pro', theme: 'light' },
        tasks: [],
        habits: [],
        goals: [],
        analytics: { focusTimeMinutes: 265 }
    };

    /**
     * Get data with schema validation and migration fallback
     */
    static get(key, defaultValue = null) {
        try {
            const fullKey = 'lifeflow_' + key;
            const data = localStorage.getItem(fullKey);
            let parsed = data !== null ? JSON.parse(data) : undefined;

            if (parsed === undefined) {
                if (Object.prototype.hasOwnProperty.call(StorageManager.inMemoryStorage, fullKey)) {
                    parsed = StorageManager.inMemoryStorage[fullKey];
                } else {
                    parsed = defaultValue !== null ? defaultValue : StorageManager.SCHEMAS[key] || null;
                }
            }

            // Validate schema type if defined
            const defaultTemplate = StorageManager.SCHEMAS[key];
            if (defaultTemplate !== undefined && parsed !== null) {
                if (typeof parsed !== typeof defaultTemplate || (Array.isArray(defaultTemplate) && !Array.isArray(parsed))) {
                    console.warn(`Schema mismatch for ${key}. Migrating to default structure.`);
                    parsed = defaultTemplate;
                    StorageManager.set(key, parsed);
                }
            }

            return parsed;
        } catch (e) {
            console.warn('Storage get error (Corrupt JSON or restricted storage), falling back:', e);
            const fullKey = 'lifeflow_' + key;
            return StorageManager.SCHEMAS[key] || defaultValue;
        }
    }
     
    /**
     * Set data and dispatch a custom event for Redux-like state synchronization across modules
     */
    static set(key, value) {
        const fullKey = 'lifeflow_' + key;
        try {
            localStorage.setItem(fullKey, JSON.stringify(value));
            StorageManager.inMemoryStorage[fullKey] = value;
        } catch (e) {
            console.warn('Storage set error (Quota exceeded or Incognito restriction). Using in-memory fallback:', e);
            StorageManager.inMemoryStorage[fullKey] = value;
        }

        // Dispatch Custom Event for Event-Driven State Synchronization
        window.dispatchEvent(new CustomEvent('lifeflowStateChange', {
            detail: { key, value }
        }));
    }
}

window.StorageManager = StorageManager;
export default StorageManager;
