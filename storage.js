// ========================================
// LocalStorage Management Module
// ========================================

const Storage = {
    KEYS: {
        RESULTS: 'xsmb_results',
        SETTINGS: 'xsmb_settings',
        LAST_UPDATE: 'xsmb_last_update'
    },

    /**
     * Save lottery results to localStorage
     * @param {Object} data - Result data with date and ket_qua
     */
    saveResult(data) {
        try {
            const existingData = this.getAllResults();

            // Check if result for this date already exists
            const existingIndex = existingData.findIndex(r => r.ngay === data.ngay);

            if (existingIndex >= 0) {
                // Update existing result
                existingData[existingIndex] = data;
            } else {
                // Add new result
                existingData.push(data);
            }

            // Sort by date (newest first)
            existingData.sort((a, b) => {
                const dateA = this.parseDate(a.ngay);
                const dateB = this.parseDate(b.ngay);
                return dateB - dateA;
            });

            // Limit to last 365 days to prevent excessive storage
            const limitedData = existingData.slice(0, 365);

            localStorage.setItem(this.KEYS.RESULTS, JSON.stringify(limitedData));
            localStorage.setItem(this.KEYS.LAST_UPDATE, new Date().toISOString());

            return true;
        } catch (error) {
            console.error('Error saving result:', error);
            return false;
        }
    },

    /**
     * Get all results from localStorage
     * @returns {Array} Array of result objects
     */
    getAllResults() {
        try {
            const data = localStorage.getItem(this.KEYS.RESULTS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting results:', error);
            return [];
        }
    },

    /**
     * Get results for a specific date range
     * @param {number} days - Number of days to retrieve
     * @returns {Array} Filtered array of results
     */
    getResultsByDays(days) {
        const allResults = this.getAllResults();
        return allResults.slice(0, days);
    },

    /**
     * Get latest result
     * @returns {Object|null} Latest result object or null
     */
    getLatestResult() {
        const results = this.getAllResults();
        return results.length > 0 ? results[0] : null;
    },

    /**
     * Parse Vietnamese date format (DD/MM/YYYY) to Date object
     * @param {string} dateStr - Date string in DD/MM/YYYY format
     * @returns {Date} Date object
     */
    parseDate(dateStr) {
        const parts = dateStr.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    },

    /**
     * Export all data as JSON
     * @returns {string} JSON string of all data
     */
    exportData() {
        const data = {
            results: this.getAllResults(),
            exported_at: new Date().toISOString(),
            version: '1.0.0'
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data from JSON
     * @param {string} jsonData - JSON string to import
     * @returns {boolean} Success status
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (!data.results || !Array.isArray(data.results)) {
                throw new Error('Invalid data format');
            }

            localStorage.setItem(this.KEYS.RESULTS, JSON.stringify(data.results));
            localStorage.setItem(this.KEYS.LAST_UPDATE, new Date().toISOString());

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    /**
     * Clear all data
     */
    clearAll() {
        localStorage.removeItem(this.KEYS.RESULTS);
        localStorage.removeItem(this.KEYS.LAST_UPDATE);
        console.log('All data cleared');
    },

    /**
     * Get last update timestamp
     * @returns {string|null} ISO timestamp string
     */
    getLastUpdate() {
        return localStorage.getItem(this.KEYS.LAST_UPDATE);
    },

    /**
     * Get total number of stored results
     * @returns {number} Count of results
     */
    getResultCount() {
        return this.getAllResults().length;
    }
};
