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
        const statusBadge = document.getElementById('statusBadge');
        const prizeList = document.getElementById('prizeList');

        try {
            statusBadge.textContent = 'Đang tải...';
            statusBadge.style.color = 'var(--color-gold)';
            console.log('[MobileApp] Starting data load...');

            let dataLoaded = false;

            // Try API module first
            if (typeof API !== 'undefined') {
                console.log('[MobileApp] API module found, calling fetchLatest...');
                try {
                    // Fetch 60 days to match PC Cold Number logic
                    const result = await API.fetchLatest(60);
                    console.log('[MobileApp] API result:', result);
                    if (result.success && result.data && result.data.length > 0) {
                        this.lotteryData = result.data;
                        dataLoaded = true;
                        console.log('[MobileApp] Loaded', this.lotteryData.length, 'records from API module');
                    }
                } catch (apiError) {
                    console.error('[MobileApp] API module error:', apiError);
                }
            }

            // Fallback: fetch directly if API failed or not available
            if (!dataLoaded) {
                console.log('[MobileApp] Using direct fetch fallback...');
                const response = await fetch('https://xoso188.net/api/front/open/lottery/history/list/game?limitNum=60&gameCode=miba');
                const data = await response.json();
                console.log('[MobileApp] Direct API response:', data);

                if (data.success && data.t && data.t.issueList && data.t.issueList.length > 0) {
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
                            console.error('[MobileApp] Error parsing issue:', e);
                            return null;
                        }
                    }).filter(r => r !== null);

                    console.log('[MobileApp] Loaded', this.lotteryData.length, 'records from direct fetch');
                    dataLoaded = true;
                }
            }

            if (!dataLoaded || this.lotteryData.length === 0) {
                throw new Error('Không có dữ liệu');
            }

            console.log('[MobileApp] Data loaded successfully. First record:', this.lotteryData[0]);

            // Auto-set date to latest result if today has no data
            const latestDateStr = this.lotteryData[0].ngay; // DD/MM/YYYY
            const todayStr = this.formatDateForAPI(new Date()); // DD/MM/YYYY

            if (latestDateStr !== todayStr) {
                console.log('[MobileApp] Today has no data, defaulting to latest:', latestDateStr);
                // Parse DD/MM/YYYY to Date object
                const [day, month, year] = latestDateStr.split('/');
                this.currentDate = new Date(year, month - 1, day);
            }

            this.calculateFrequencies();
            this.updateUI();

        } catch (error) {
            console.error('[MobileApp] Error loading data:', error);
            statusBadge.textContent = 'Lỗi: ' + error.message;
            statusBadge.style.color = '#ff6b6b';
            if (prizeList) {
                prizeList.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff6b6b;">Lỗi tải dữ liệu. Vui lòng thử lại.</div>';
            }
        }
    }

    calculateFrequencies() {
        // 1. Calculate HOT numbers (Based on last 7 days - Matching PC)
        const hotDays = 7;
        const hotDataSlice = this.lotteryData.slice(0, hotDays);
        const hotFreq = {};

        hotDataSlice.forEach(issue => {
            this.extractNumbers(issue).forEach(num => {
                hotFreq[num] = (hotFreq[num] || 0) + 1;
            });
        });

        // 2. Calculate COLD numbers (Days since last appearance - Matching PC)
        // Check entire loaded history (up to 60 days)
        const lastSeen = {}; // { '00': 5 (days ago), ... }
        for (let i = 0; i < 100; i++) {
            const k = i.toString().padStart(2, '0');
            lastSeen[k] = this.lotteryData.length; // Default to max loaded
        }

        this.lotteryData.forEach((issue, daysAgo) => {
            const nums = this.extractNumbers(issue);
            nums.forEach(n => {
                // We want the MOST RECENT appearance (smallest daysAgo)
                if (lastSeen[n] === this.lotteryData.length) {
                    lastSeen[n] = daysAgo;
                }
            });
        });

        // 3. For Prediction, we might want a longer term frequency (e.g. 30 days)
        const predictSlice = this.lotteryData.slice(0, 30);
        this.frequencyData = {}; // Using this for prediction sorting
        predictSlice.forEach(issue => {
            this.extractNumbers(issue).forEach(num => {
                this.frequencyData[num] = (this.frequencyData[num] || 0) + 1;
            });
        });

        // --- Store processed stats for UI ---

        // Hot: Top frequent in 7 days
        this.hotStats = Object.entries(hotFreq)
            .map(([num, count]) => ({ num, count }))
            .sort((a, b) => b.count - a.count);

        // Cold: Top days since
        this.coldStats = Object.entries(lastSeen)
            .map(([num, days]) => ({ num, days }))
            .sort((a, b) => b.days - a.days); // Descending days (gan lâu nhất)
    }

    // Helper to extract all numbers from an issue
    extractNumbers(issue) {
        if (!issue || !issue.ket_qua) return [];
        let nums = [];
        // DB
        if (issue.ket_qua['giai-db']) nums.push(...issue.ket_qua['giai-db']);
        // Other prizes
        ['giai-nhat', 'giai-nhi', 'giai-ba', 'giai-tu', 'giai-nam', 'giai-sau', 'giai-bay'].forEach(key => {
            if (issue.ket_qua[key]) nums.push(...issue.ket_qua[key]);
        });
        // Ensure 2 digits format strings
        return nums.map(n => String(n).trim().slice(-2));
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

        // Debug info attach
        statusBadge.onclick = () => {
            if (!todayData) {
                const target = this.normalizeDateStr(this.formatDateForAPI(this.currentDate));
                const available = this.lotteryData.map(d => this.normalizeDateStr(d.ngay)).slice(0, 5).join(', ');
                alert(`Debug Info:\nTarget: "${target}"\nAvailable: ${available}\nRaw API Date: ${this.lotteryData[0]?.ngay}`);
            }
        };

        if (todayData) {
            statusBadge.textContent = 'Đã có kết quả';
            statusBadge.style.color = 'var(--color-success)';
            statusBadge.style.cursor = 'default';
        } else {
            statusBadge.textContent = 'Chưa có kết quả (Click test)';
            statusBadge.style.color = 'var(--text-muted)';
            statusBadge.style.cursor = 'pointer';
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
        // Update 3 top cards: Hot, Cold, Date using pre-calculated stats from calculateFrequencies
        const panels = document.querySelectorAll('.stat-card');
        if (panels.length < 3) return;

        // 1. Hot Symbol (Top 1 Hot - 7 days)
        const topHot = this.hotStats.length > 0 ? this.hotStats[0] : { num: '--', count: 0 };
        const hotPanel = panels[0];
        hotPanel.querySelector('.stat-value').textContent = topHot.num;
        hotPanel.querySelector('.stat-label').textContent = `${topHot.count} lần (7 ngày)`;

        // 2. Cold Symbol (Top 1 Cold - Days Since)
        const topCold = this.coldStats.length > 0 ? this.coldStats[0] : { num: '--', days: 0 };
        const coldPanel = panels[1];
        coldPanel.querySelector('.stat-value').textContent = topCold.num;
        coldPanel.querySelector('.stat-label').textContent = `${topCold.days} ngày chưa về`;

        // 3. Current Date Info
        const datePanel = panels[2];
        const dayStr = this.currentDate.getDate();
        datePanel.querySelector('.stat-value').textContent = dayStr;
        datePanel.querySelector('.stat-label').textContent = `Tháng ${this.currentDate.getMonth() + 1}`;
    }

    updateFrequencyGrid() {
        const grid = document.getElementById('frequencyGrid');
        if (!grid) return;

        // Show frequency of 00-99 based on 30-day data (stored in this.frequencyData)
        let html = '';
        for (let i = 0; i < 100; i++) {
            const num = i.toString().padStart(2, '0');
            const count = this.frequencyData[num] || 0;
            // Highlight logic
            let className = 'freq-item';
            if (count >= 10) className += ' high';
            else if (count <= 2) className += ' low';

            html += `
                <div class="${className}">
                    <div class="freq-num">${num}</div>
                    <div class="freq-count">${count}</div>
                </div>
            `;
        }
        grid.innerHTML = html;
    }

    // ==========================================
    // AI PREDICTION ENGINE
    // ==========================================

    generateAIPredictions() {
        if (this.lotteryData.length === 0) return [];

        // 1. Data Prep
        const currentNumbers = this.extractNumbers(this.lotteryData[0]);
        const sampleSize = Math.min(this.lotteryData.length, 60);

        // 2. Calculate Component Scores
        const markovProbs = this.analyzeMarkov(currentNumbers, sampleSize);
        const poissonProbs = this.analyzePoisson(sampleSize);
        const varianceMap = this.analyzeVariance(30);
        const coldMap = this.coldStats.reduce((acc, curr) => ({ ...acc, [curr.num]: curr.days }), {});

        // 3. Aggregate Scores
        const finalScores = [];
        for (let i = 0; i < 100; i++) {
            const num = String(i).padStart(2, '0');
            let score = 0;
            const factors = [];

            // A. Markov (35%)
            const mRaw = markovProbs[num] || 0;
            const mScore = Math.min(mRaw * 40, 100);

            // B. Poisson (25%)
            const pRaw = poissonProbs[num] || 0;
            const pScore = pRaw * 100;

            // C. Variance (20%)
            const zScore = varianceMap[num] || 0;
            const vScore = Math.max(0, zScore * 20);

            // D. Cold/Cycle (20%)
            const daysSince = coldMap[num] || 0;
            let cScore = 0;
            if (daysSince > 10 && daysSince < 25) cScore = 80; // Golden cycle
            else if (daysSince >= 25) cScore = 60 + Math.min(daysSince, 30);
            else cScore = 20;

            // Weighted Sum
            score += mScore * 0.35;
            score += pScore * 0.25;
            score += vScore * 0.20;
            score += cScore * 0.20;

            // Determine primary factors
            if (mScore > 60) factors.push('Markov');
            if (pScore > 25) factors.push('Poisson');
            if (zScore > 1.5) factors.push('Cầu Đỏ');
            if (daysSince > 12) factors.push('Nhịp Đẹp');

            finalScores.push({
                num,
                score,
                factors: factors.length > 0 ? factors : ['Tần suất']
            });
        }

        // Sort by Score Descending
        return finalScores.sort((a, b) => b.score - a.score);
    }

    analyzeMarkov(currentNumbers, samples) {
        const results = this.lotteryData.slice(0, samples);
        if (results.length < 2) return {};

        const transitions = {};
        // Train
        for (let i = 1; i < results.length; i++) {
            const prevDraw = this.extractNumbers(results[i]);
            const nextDraw = this.extractNumbers(results[i - 1]);

            prevDraw.forEach(prev => {
                if (!transitions[prev]) transitions[prev] = { total: 0, nextCounts: {} };
                transitions[prev].total++;
                nextDraw.forEach(next => {
                    transitions[prev].nextCounts[next] = (transitions[prev].nextCounts[next] || 0) + 1;
                });
            });
        }

        // Predict
        const probs = {};
        currentNumbers.forEach(todayNum => {
            const state = transitions[todayNum];
            if (state && state.total > 0) {
                Object.entries(state.nextCounts).forEach(([nextNum, count]) => {
                    probs[nextNum] = (probs[nextNum] || 0) + (count / state.total);
                });
            }
        });
        return probs;
    }

    analyzePoisson(samples) {
        const results = this.lotteryData.slice(0, samples);
        const counts = {};
        for (let i = 0; i < 100; i++) counts[String(i).padStart(2, '0')] = 0;

        results.forEach(res => {
            const nums = new Set(this.extractNumbers(res));
            nums.forEach(n => counts[n]++);
        });

        const probs = {};
        const total = results.length || 1;
        Object.entries(counts).forEach(([num, count]) => {
            const lambda = count / total;
            probs[num] = 1 - Math.exp(-lambda);
        });
        return probs;
    }

    analyzeVariance(samples) {
        const results = this.lotteryData.slice(0, samples);
        const theoretical = 27 / 100;
        const expected = samples * theoretical;
        const stdDev = Math.sqrt(samples * theoretical * (1 - theoretical));

        const counts = {};
        results.forEach(res => {
            this.extractNumbers(res).forEach(n => counts[n] = (counts[n] || 0) + 1);
        });

        const zScores = {}; // Variance Map
        for (let i = 0; i < 100; i++) {
            const num = String(i).padStart(2, '0');
            const actual = counts[num] || 0;
            zScores[num] = (actual - expected) / stdDev;
        }
        return zScores;
    }

    updatePredictions() {
        const grid = document.getElementById('predictionGrid');
        const btSection = document.getElementById('bachThuSection');
        const btNumber = document.getElementById('bachThuNumber');
        const btDesc = document.getElementById('bachThuDesc');

        if (!grid) return;

        // Use AI Predictions instead of simple frequency
        const aiPredictions = this.generateAIPredictions();
        const top10 = aiPredictions.slice(0, 10);

        // 1. Bach Thu (Top 1 AI)
        if (top10.length > 0) {
            const best = top10[0];
            const confidence = Math.min(Math.round(best.score / 3 * 100) + 20, 99); // Normalize a bit for display

            if (btSection && btNumber) {
                btSection.style.display = 'block';
                btNumber.textContent = best.num;
                if (btDesc) btDesc.textContent = `Độ tin cậy: ${confidence}% (${best.factors.join(' + ')})`;
            }
            // Remove top 1 from grid
            top10.shift();
        }

        // 2. Top Grid (Next numbers)
        let html = '';
        top10.slice(0, 6).forEach(item => {
            const confidence = Math.round(item.score * 10); // Rough pct
            const displayConf = Math.min(confidence + 30, 98);

            html += `
                <div class="prediction-card">
                    <div class="prediction-num">${item.num}</div>
                    <div class="prediction-conf">${displayConf}%</div>
                    <div style="font-size: 9px; color: #fff; opacity: 0.5;">${item.factors[0]}</div>
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
        const targetStr = this.normalizeDateStr(this.formatDateForAPI(date));
        return this.lotteryData.find(d => this.normalizeDateStr(d.ngay) === targetStr);
    }

    // Helper to accept various formats like d/m/yyyy or dd/mm/yyyy
    normalizeDateStr(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.trim().split('/');
        if (parts.length !== 3) return dateStr.trim();
        return parts.map(p => p.padStart(2, '0')).join('/');
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
        return `${d}/${m}/${y}`;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.mobileApp = new MobileApp();
});
