/**
 * XSMB Analytics - Mobile App JS
 * Optimized for mobile interface
 */

class MobileApp {
    constructor() {
        this.currentDate = new Date();
        this.lotteryData = [];
        this.frequencyData = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
    }

    setupEventListeners() {
        // Date navigation
        document.getElementById('prevDateBtn')?.addEventListener('click', () => this.changeDate(-1));
        document.getElementById('nextDateBtn')?.addEventListener('click', () => this.changeDate(1));
        document.getElementById('todayBtn')?.addEventListener('click', () => this.goToToday());
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadData());

        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    }

    switchTab(tabId) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        // Update panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabId}-panel`);
        });
    }

    async loadData() {
        try {
            // Use existing API module
            if (typeof API !== 'undefined') {
                const result = await API.fetchLatest(30);
                if (result.success && result.data) {
                    this.lotteryData = result.data;
                } else {
                    throw new Error(result.error || 'Failed to fetch data');
                }
            } else {
                // Fallback: fetch directly
                const response = await fetch('https://xoso188.net/api/front/open/lottery/history/list/game?limitNum=30&gameCode=miba');
                const data = await response.json();
                if (data.success && data.t && data.t.issueList) {
                    // Parse the data manually
                    this.lotteryData = data.t.issueList.map(issue => {
                        try {
                            const detailArray = JSON.parse(issue.detail);
                            return {
                                ngay: issue.turnNum,
                                ket_qua: {
                                    'giai-db': detailArray[0] ? [detailArray[0]] : [],
                                    'giai-nhat': detailArray[1] ? [detailArray[1]] : [],
                                    'giai-nhi': detailArray[2] ? detailArray[2].split(',') : [],
                                    'giai-ba': detailArray[3] ? detailArray[3].split(',') : [],
                                    'giai-tu': detailArray[4] ? detailArray[4].split(',') : [],
                                    'giai-nam': detailArray[5] ? detailArray[5].split(',') : [],
                                    'giai-sau': detailArray[6] ? detailArray[6].split(',') : [],
                                    'giai-bay': detailArray[7] ? detailArray[7].split(',') : []
                                },
                                openTime: issue.openTime
                            };
                        } catch (e) {
                            return null;
                        }
                    }).filter(r => r !== null);
                }
            }

            this.calculateFrequencies();
            this.updateUI();
        } catch (error) {
            console.error('Error loading data:', error);
            document.getElementById('statusBadge').textContent = 'Lỗi tải dữ liệu';
        }
    }

    calculateFrequencies() {
        this.frequencyData = {};
        for (let i = 0; i < 100; i++) {
            this.frequencyData[i.toString().padStart(2, '0')] = 0;
        }

        const last30Days = this.lotteryData.slice(0, 30);
        last30Days.forEach(day => {
            if (day.ket_qua) {
                // Extract all numbers from ket_qua
                Object.values(day.ket_qua).forEach(prizeArray => {
                    if (Array.isArray(prizeArray)) {
                        prizeArray.forEach(num => {
                            const numStr = String(num).trim();
                            if (numStr.length >= 2) {
                                const last2 = numStr.slice(-2);
                                if (this.frequencyData.hasOwnProperty(last2)) {
                                    this.frequencyData[last2]++;
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    updateUI() {
        this.updateDateDisplay();
        this.updateResults();
        this.updateLotoTables();
        this.updateStats();
        this.updateFrequencyGrid();
        this.updatePredictions();
        this.updateChart();
    }

    updateDateDisplay() {
        const dateStr = this.formatDate(this.currentDate);
        document.getElementById('currentDateDisplay').textContent = dateStr;

        // Find data for current date
        const todayData = this.findDataByDate(this.currentDate);
        const statusBadge = document.getElementById('statusBadge');

        if (todayData) {
            statusBadge.textContent = 'Đã có kết quả';
            statusBadge.style.color = 'var(--color-success)';
        } else {
            statusBadge.textContent = 'Chưa có kết quả';
            statusBadge.style.color = 'var(--text-muted)';
        }
    }

    updateResults() {
        const data = this.findDataByDate(this.currentDate);
        const specialPrize = document.getElementById('specialPrize');
        const prizeList = document.getElementById('prizeList');

        if (!data || !data.ket_qua) {
            specialPrize.textContent = '-----';
            prizeList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Chưa có kết quả</div>';
            return;
        }

        // Special prize (giải đặc biệt)
        const db = data.ket_qua['giai-db'];
        specialPrize.textContent = (db && db[0]) || '-----';

        // Other prizes
        const prizeMap = [
            { key: 'giai-nhat', name: 'G.Nhất' },
            { key: 'giai-nhi', name: 'G.Nhì' },
            { key: 'giai-ba', name: 'G.Ba' },
            { key: 'giai-tu', name: 'G.Tư' },
            { key: 'giai-nam', name: 'G.Năm' },
            { key: 'giai-sau', name: 'G.Sáu' },
            { key: 'giai-bay', name: 'G.Bảy' }
        ];

        let html = '';
        prizeMap.forEach(prize => {
            const values = data.ket_qua[prize.key] || [];
            html += `
                <div class="prize-row">
                    <div class="prize-label">${prize.name}</div>
                    <div class="prize-values">
                        ${values.map(v => `<span class="prize-num">${v}</span>`).join('')}
                    </div>
                </div>
            `;
        });

        prizeList.innerHTML = html;
    }

    updateLotoTables() {
        const data = this.findDataByDate(this.currentDate);
        const lotoHead = document.getElementById('lotoHead');
        const lotoTail = document.getElementById('lotoTail');

        if (!data || !data.ket_qua) {
            lotoHead.innerHTML = '<div style="padding: 10px; text-align: center; color: var(--text-muted);">--</div>';
            lotoTail.innerHTML = '<div style="padding: 10px; text-align: center; color: var(--text-muted);">--</div>';
            return;
        }

        // Extract all 2-digit endings from ket_qua
        const endings = [];
        Object.values(data.ket_qua).forEach(prizeArray => {
            if (Array.isArray(prizeArray)) {
                prizeArray.forEach(num => {
                    const numStr = String(num).trim();
                    if (numStr.length >= 2) {
                        endings.push(numStr.slice(-2));
                    }
                });
            }
        });

        // Group by head and tail
        const byHead = {};
        const byTail = {};

        for (let i = 0; i < 10; i++) {
            byHead[i] = [];
            byTail[i] = [];
        }

        endings.forEach(num => {
            const head = parseInt(num[0]);
            const tail = parseInt(num[1]);
            byHead[head].push(num);
            byTail[tail].push(num);
        });

        // Render
        let headHtml = '';
        let tailHtml = '';

        for (let i = 0; i < 10; i++) {
            headHtml += `
                <div class="loto-row">
                    <span class="loto-head">${i}</span>
                    <span class="loto-nums">${byHead[i].join(', ') || '-'}</span>
                </div>
            `;
            tailHtml += `
                <div class="loto-row">
                    <span class="loto-head">${i}</span>
                    <span class="loto-nums">${byTail[i].join(', ') || '-'}</span>
                </div>
            `;
        }

        lotoHead.innerHTML = headHtml;
        lotoTail.innerHTML = tailHtml;
    }

    updateStats() {
        // Hottest number
        let hottest = { num: '--', count: 0 };
        let coldest = { num: '--', count: Infinity };

        Object.entries(this.frequencyData).forEach(([num, count]) => {
            if (count > hottest.count) {
                hottest = { num, count };
            }
            if (count < coldest.count) {
                coldest = { num, count };
            }
        });

        document.getElementById('hottestNumber').textContent = hottest.num;
        document.getElementById('coldestNumber').textContent = coldest.num;
        document.getElementById('totalDays').textContent = Math.min(this.lotteryData.length, 30);

        // Average
        const total = Object.values(this.frequencyData).reduce((a, b) => a + b, 0);
        const avg = (total / 100).toFixed(1);
        document.getElementById('avgCount').textContent = avg;
    }

    updateFrequencyGrid() {
        const grid = document.getElementById('frequencyGrid');
        if (!grid) return;

        const sortedEntries = Object.entries(this.frequencyData)
            .sort((a, b) => b[1] - a[1]);

        const maxCount = sortedEntries[0]?.[1] || 1;
        const minCount = sortedEntries[sortedEntries.length - 1]?.[1] || 0;

        // Render in order 00-99
        let html = '';
        for (let i = 0; i < 100; i++) {
            const num = i.toString().padStart(2, '0');
            const count = this.frequencyData[num] || 0;

            let className = 'number-item';
            if (count >= maxCount - 1) className += ' hot';
            else if (count <= minCount + 1) className += ' cold';

            html += `
                <div class="${className}">
                    <div class="number-val">${num}</div>
                    <div class="number-count">${count} lần</div>
                </div>
            `;
        }

        grid.innerHTML = html;
    }

    updatePredictions() {
        const grid = document.getElementById('predictionGrid');
        if (!grid) return;

        // Simple prediction: top 6 hot numbers
        const sorted = Object.entries(this.frequencyData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        let html = '';
        sorted.forEach(([num, count]) => {
            const confidence = Math.round((count / 30) * 100);
            html += `
                <div class="prediction-card">
                    <div class="prediction-num">${num}</div>
                    <div class="prediction-conf">${confidence}%</div>
                </div>
            `;
        });

        grid.innerHTML = html;
    }

    updateChart() {
        const canvas = document.getElementById('frequencyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = Object.keys(this.frequencyData);
        const data = Object.values(this.frequencyData);

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(192, 46, 46, 0.6)',
                    borderColor: 'rgba(192, 46, 46, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 8 },
                            maxRotation: 90,
                            minRotation: 90
                        },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: '#94a3b8', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                }
            }
        });
    }

    changeDate(delta) {
        this.currentDate.setDate(this.currentDate.getDate() + delta);
        this.updateUI();
    }

    goToToday() {
        this.currentDate = new Date();
        this.updateUI();
    }

    findDataByDate(date) {
        const dateStr = this.formatDateForAPI(date);
        return this.lotteryData.find(d => d.ngay === dateStr);
    }

    formatDate(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }

    formatDateForAPI(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${y}${m}${d}`;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.mobileApp = new MobileApp();
});
