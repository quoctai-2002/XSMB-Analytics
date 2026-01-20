// ========================================
// Main Application Controller
// ========================================

const App = {
    currentTab: 'frequency',
    predictionMethod: 'combined',
    predictionDays: 7,
    currentResultIndex: 0, // 0 = newest result

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing XSMB Statistics Tool...');

        // Setup event listeners
        this.setupEventListeners();

        // Check if we have data
        const hasData = Storage.getResultCount() > 0;

        if (!hasData) {
            // First time - fetch data from API
            Components.updateStatusBadge('info', 'Đang tải dữ liệu...');
            await this.refreshData();
        } else {
            // Load existing data
            this.renderAll();
            Components.updateStatusBadge('success', 'Sẵn sàng');
        }

        // Update date display
        this.updateDateNavigation();
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshData();
        });

        // Settings button
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.openSettings();
        });

        // Tab navigation
        document.querySelectorAll('.tab-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Prediction method selector
        document.getElementById('predictionMethod')?.addEventListener('change', (e) => {
            this.predictionMethod = e.target.value;
            this.renderPredictionsTab();
        });

        // Prediction days selector
        document.getElementById('predictionDays')?.addEventListener('change', (e) => {
            this.predictionDays = parseInt(e.target.value);
            this.renderPredictionsTab();
        });

        // Settings modal
        document.getElementById('closeModal')?.addEventListener('click', () => {
            this.closeSettings();
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('importFile')?.click();
        });

        document.getElementById('importFile')?.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clearDataBtn')?.addEventListener('click', () => {
            this.clearData();
        });

        // Close modal on outside click
        document.getElementById('settingsModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });

        // Date navigation
        document.getElementById('prevDateBtn')?.addEventListener('click', () => {
            this.navigateDate(1); // Go to older result
        });

        document.getElementById('nextDateBtn')?.addEventListener('click', () => {
            this.navigateDate(-1); // Go to newer result
        });

        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.currentResultIndex = 0;
            this.renderCurrentResult();
            this.updateDateNavigation();
        });
    },

    /**
     * Fetch fresh data from API
     */
    async refreshData() {
        Components.updateStatusBadge('info', 'Đang tải...');
        Components.showLoading('latestResults');

        const result = await API.fetchAndSave();

        if (result.success) {
            Components.updateStatusBadge('success', 'Đã cập nhật');
            this.renderAll();
            console.log('✅ Data refreshed successfully');
        } else {
            Components.updateStatusBadge('warning', 'Lỗi kết nối');
            console.error('❌ Failed to refresh data:', result.error);

            // Still render existing data if available
            if (Storage.getResultCount() > 0) {
                this.renderAll();
            }
        }
    },

    /**
     * Render all components
     */
    renderAll() {
        // Update dashboard stats
        const stats = Statistics.getSummary();
        Components.updateDashboardStats(stats);

        // Render current result based on index
        this.renderCurrentResult();

        // Render current tab content
        this.renderCurrentTab();

        // Update date navigation
        this.updateDateNavigation();
    },

    /**
     * Render result at current index
     */
    renderCurrentResult() {
        const results = Storage.getAllResults();
        if (results.length === 0) {
            Components.renderResultsTable(null, 'latestResults');
            return;
        }

        // Clamp index
        this.currentResultIndex = Math.max(0, Math.min(this.currentResultIndex, results.length - 1));

        const result = results[this.currentResultIndex];
        Components.renderResultsTable(result, 'latestResults');
    },

    /**
     * Navigate to different date
     * @param {number} delta - Direction (+1 = older, -1 = newer)
     */
    navigateDate(delta) {
        const results = Storage.getAllResults();
        const newIndex = this.currentResultIndex + delta;

        if (newIndex >= 0 && newIndex < results.length) {
            this.currentResultIndex = newIndex;
            this.renderCurrentResult();
            this.updateDateNavigation();
        }
    },

    /**
     * Update date navigation UI
     */
    updateDateNavigation() {
        const results = Storage.getAllResults();
        const dateDisplay = document.getElementById('currentDateDisplay');
        const prevBtn = document.getElementById('prevDateBtn');
        const nextBtn = document.getElementById('nextDateBtn');
        const todayBtn = document.getElementById('todayBtn');

        if (results.length === 0) {
            if (dateDisplay) dateDisplay.textContent = 'Chưa có dữ liệu';
            return;
        }

        const currentResult = results[this.currentResultIndex];
        if (dateDisplay && currentResult) {
            dateDisplay.textContent = currentResult.ngay || '--/--/----';
        }

        // Enable/disable navigation buttons
        if (prevBtn) prevBtn.disabled = this.currentResultIndex >= results.length - 1;
        if (nextBtn) nextBtn.disabled = this.currentResultIndex <= 0;
        if (todayBtn) todayBtn.style.display = this.currentResultIndex === 0 ? 'none' : 'flex';
    },

    /**
     * Switch between tabs
     * @param {string} tabName - Tab name to switch to
     */
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-pill').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        // Render tab content
        this.renderCurrentTab();
    },

    /**
     * Render current tab content
     */
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'frequency':
                this.renderFrequencyTab();
                break;
            case 'hotcold':
                this.renderHotColdTab();
                break;
            case 'pairs':
                this.renderPairsTab();
                break;
            case 'prediction':
                this.renderPredictionsTab();
                break;
        }
    },

    /**
     * Render Frequency Tab
     */
    renderFrequencyTab() {
        const frequencyData = Statistics.calculateFrequency(30);

        // Render chart
        Charts.renderFrequencyChart(frequencyData, 30);

        // Render grid
        Components.renderNumberGrid(frequencyData, 'frequencyGrid');
    },

    /**
     * Render Hot/Cold Tab
     */
    renderHotColdTab() {
        const hotNumbers = Statistics.analyzeHotNumbers(7, 15);
        const coldNumbers = Statistics.analyzeColdNumbers(60);
        const topCold = coldNumbers.slice(0, 15);

        // Render lists
        Components.renderNumberList(hotNumbers, 'hotNumbers', 'hot');
        Components.renderNumberList(topCold, 'coldNumbers', 'cold');

        // Render heatmap
        Charts.renderHeatmap(20);
    },

    /**
     * Render Pairs Tab
     */
    renderPairsTab() {
        const pairs = Statistics.analyzePairs(30, 30);
        Components.renderPairsGrid(pairs, 'pairsGrid');
    },

    /**
     * Render Predictions Tab
     */
    renderPredictionsTab() {
        const predictions = Statistics.generatePredictions(this.predictionMethod, 20, this.predictionDays);
        Components.renderPredictions(predictions, 'predictionsList');
        Components.renderVipPicks(predictions);
        Components.renderTrendChart(predictions);
    },

    /**
     * Open settings modal
     */
    openSettings() {
        const modal = document.getElementById('settingsModal');
        modal?.classList.add('active');
    },

    /**
     * Close settings modal
     */
    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal?.classList.remove('active');
    },

    /**
     * Export data to JSON file
     */
    exportData() {
        const jsonData = Storage.exportData();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `xsmb-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📥 Data exported successfully');
        alert('Dữ liệu đã được export thành công!');
    },

    /**
     * Import data from JSON file
     * @param {File} file - JSON file to import
     */
    async importData(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const success = Storage.importData(text);

            if (success) {
                console.log('📤 Data imported successfully');
                alert('Dữ liệu đã được import thành công!');
                this.renderAll();
                this.closeSettings();
            } else {
                alert('Lỗi: File không đúng định dạng!');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Lỗi khi import dữ liệu!');
        }
    },

    /**
     * Clear all data
     */
    clearData() {
        const confirmed = confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác!');

        if (confirmed) {
            Storage.clearAll();
            console.log('🗑️ All data cleared');
            alert('Đã xóa toàn bộ dữ liệu!');
            location.reload();
        }
    }
};

// ========================================
// Initialize app when DOM is ready
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
