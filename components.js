// ========================================
// UI Components Module - Improved Version
// ========================================

const Components = {

    /**
     * Render lottery results with premium design
     * @param {Object} result - Result object with ngay and ket_qua
     * @param {string} containerId - Container element ID
     */
    renderResultsTable(result, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!result) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">Chưa có dữ liệu. Click nút Làm Mới để tải.</p>';
            return;
        }

        const { ngay, ket_qua } = result;

        // Special prize digits
        const specialNumber = ket_qua['giai-db']?.[0] || '00000';
        const specialDigits = String(specialNumber).split('');

        // Prize configuration mapping
        const prizeOrder = [
            { key: 'giai-db', name: 'ĐẶC BIỆT', special: true },
            { key: 'giai-nhat', name: 'Giải Nhất' },
            { key: 'giai-nhi', name: 'Giải Nhì' },
            { key: 'giai-ba', name: 'Giải Ba' },
            { key: 'giai-tu', name: 'Giải Tư' },
            { key: 'giai-nam', name: 'Giải Năm' },
            { key: 'giai-sau', name: 'Giải Sáu' },
            { key: 'giai-bay', name: 'Giải Bảy', highlight: true }
        ];


        let html = `
            <div class="results-flex-container" style="display: flex; gap: 30px; align-items: flex-start; flex-wrap: wrap;">
            <div class="lottery-table-wrapper" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); flex: 1; min-width: 400px;">
                <table class="lottery-table" style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        ${prizeOrder.map(prize => {
            const values = ket_qua[prize.key] || [];
            if (values.length === 0) return '';

            const isSpecial = prize.special;
            const isLast = prize.highlight;

            return `
                                <tr style="border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'};">
                                    <td style="
                                        width: 100px;
                                        padding: ${isSpecial ? '25px 15px' : '15px'};
                                        text-align: right;
                                        vertical-align: middle;
                                        font-size: ${isSpecial ? '13px' : '12px'};
                                        font-weight: ${isSpecial ? '700' : '500'};
                                        color: ${isSpecial ? '#ffd700' : '#64748b'};
                                        text-transform: uppercase;
                                        letter-spacing: 1px;
                                        white-space: nowrap;
                                    ">${prize.name}</td>
                                    <td style="
                                        padding: ${isSpecial ? '25px 20px' : '15px 20px'};
                                        text-align: center;
                                        vertical-align: middle;
                                    ">
                                        <div style="display: flex; flex-wrap: wrap; gap: ${isSpecial ? '0' : '20px'}; justify-content: center; align-items: center;">
                                            ${values.map(num => `
                                                <span style="
                                                    font-family: 'Monaco', 'Consolas', monospace;
                                                    font-size: ${isSpecial ? '52px' : '22px'};
                                                    font-weight: ${isSpecial ? '800' : '600'};
                                                    color: ${isSpecial ? '#ffd700' : (isLast ? '#ef4444' : '#f1f5f9')};
                                                    letter-spacing: ${isSpecial ? '6px' : '1px'};
                                                    ${isSpecial ? 'text-shadow: 0 0 20px rgba(255,215,0,0.4), 0 2px 4px rgba(0,0,0,0.3);' : ''}
                                                ">${num}</span>
                                            `).join('')}
                                        </div>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Loto Section -->
            <div class="loto-section-ticket" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">
                <div style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 15px; letter-spacing: 1px; font-weight: 600;">📊 BẢNG LOTO ĐẦU - ĐUÔI</div>
                <div class="loto-tables">
                    ${this.renderLotoTable(ket_qua)}
                </div>
            </div>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Render Loto Dau-Duoi Table
     */
    renderLotoTable(ket_qua) {
        const lotoData = this.generateLotoData(ket_qua);

        return `
            <div class="loto-table" style="min-width: 160px;">
                <div class="loto-header">
                    <span class="loto-header-key">Đầu</span>
                    <span class="loto-header-val">Loto</span>
                </div>
                ${Object.entries(lotoData.dau).map(([key, values]) => `
                    <div class="loto-row">
                        <span class="loto-key">${key}</span>
                        <span class="loto-val" style="min-width: 100px;">${values.length > 0 ? values.join(', ') : '-'}</span>
                    </div>
                `).join('')}
            </div>
            <div class="loto-table" style="min-width: 160px;">
                <div class="loto-header">
                    <span class="loto-header-key">Đuôi</span>
                    <span class="loto-header-val">Loto</span>
                </div>
                ${Object.entries(lotoData.duoi).map(([key, values]) => `
                    <div class="loto-row">
                        <span class="loto-key">${key}</span>
                        <span class="loto-val" style="min-width: 100px;">${values.length > 0 ? values.join(', ') : '-'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Generate Loto data from results
     */
    generateLotoData(ket_qua) {
        const dau = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };
        const duoi = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };

        // Get last 2 digits from all prizes
        Object.values(ket_qua).forEach(values => {
            if (!Array.isArray(values)) return;
            values.forEach(num => {
                const numStr = String(num);
                if (numStr.length >= 2) {
                    const last2 = numStr.slice(-2);
                    const d = parseInt(last2[0]);
                    const u = parseInt(last2[1]);
                    if (!dau[d].includes(last2)) dau[d].push(last2);
                    if (!duoi[u].includes(last2)) duoi[u].push(last2);
                }
            });
        });

        return { dau, duoi };
    },

    /**
     * Render number grid with frequency data
     */
    renderNumberGrid(frequencyData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const counts = frequencyData.map(d => d.count);
        const maxCount = Math.max(...counts);
        const minCount = Math.min(...counts);
        const range = maxCount - minCount || 1;

        let html = '';
        frequencyData.forEach(item => {
            const { number, count, percentage } = item;

            let category = '';
            let icon = '';
            if (count >= maxCount * 0.9) { category = 'hot'; icon = '🔥'; }
            else if (count >= maxCount * 0.7) { category = 'warm'; icon = '🔶'; }
            else if (count <= minCount * 1.1) { category = 'cold'; icon = '❄️'; }

            html += `
                <div class="number-item ${category}" title="${count} lần (${percentage}%)">
                    <div class="number-icon">${icon}</div>
                    <div class="number-value">${number}</div>
                    <div class="number-count">${count} lần</div>
                    <div class="number-percent">${percentage}%</div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Render list of hot or cold numbers
     */
    renderNumberList(numbers, containerId, type = 'hot') {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '';
        numbers.forEach((item, index) => {
            const { number, count, daysSince } = item;
            const icon = type === 'hot' ? '🔥' : '❄️';
            const metaText = type === 'hot'
                ? `${count} lần xuất hiện`
                : `${daysSince} ngày chưa về`;

            // Calculate bar width
            const maxVal = type === 'hot' ? numbers[0]?.count : numbers[0]?.daysSince;
            const currentVal = type === 'hot' ? count : daysSince;
            const barWidth = maxVal > 0 ? (currentVal / maxVal * 100) : 0;

            html += `
                <div class="number-list-item ${type}">
                    <div class="number-list-left">
                        <span class="number-rank">${index + 1}</span>
                        <span class="number-badge ${type}">${number}</span>
                    </div>
                    <div class="number-bar-container">
                        <div class="number-bar ${type}" style="width: ${barWidth}%"></div>
                    </div>
                    <div class="number-meta">${metaText} ${icon}</div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="text-align: center; color: var(--color-text-secondary);">Không có dữ liệu</p>';
    },

    /**
     * Render pairs grid
     */
    renderPairsGrid(pairs, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '';
        pairs.forEach((item, index) => {
            const { num1, num2, count } = item;
            const isTop = index < 5;

            html += `
                <div class="pair-item ${isTop ? 'top' : ''}">
                    <div class="pair-rank">#${index + 1}</div>
                    <div class="pair-numbers">${num1} - ${num2}</div>
                    <div class="pair-count">${count} lần</div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="text-align: center; color: var(--color-text-secondary);">Không có dữ liệu</p>';
    },

    /**
     * Render predictions with confidence bars
     */
    renderPredictions(predictions, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Apply grid style directly to container
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(5, 1fr)';
        container.style.gap = '16px';

        let html = '';

        predictions.forEach((item, index) => {
            const { number, confidence, confidenceLevel, reason } = item;
            const isTop5 = index < 5;

            let tierClass = '';
            let tierLabel = '';
            if (confidence >= 75) { tierClass = 'tier-gold'; tierLabel = '⭐ TOP'; }
            else if (confidence >= 50) { tierClass = 'tier-silver'; tierLabel = '🔥 HOT'; }
            else { tierClass = 'tier-bronze'; tierLabel = '📊'; }

            html += `
                <div class="prediction-card ${tierClass}" style="display: flex; flex-direction: column; align-items: center; padding: 16px; background: var(--color-bg-tertiary); border-radius: 12px; border: 2px solid ${tierClass === 'tier-gold' ? 'var(--color-gold)' : tierClass === 'tier-silver' ? 'var(--color-primary)' : 'var(--color-info)'};">
                    <div style="font-size: 12px; font-weight: 700; color: var(--color-gold); margin-bottom: 4px;">${tierLabel}</div>
                    <div style="font-size: 36px; font-weight: 800; font-family: Monaco, monospace; color: var(--color-text-primary); margin-bottom: 8px;">${number}</div>
                    <div style="width: 100%; height: 6px; background: var(--color-bg-secondary); border-radius: 10px; overflow: hidden; margin-bottom: 8px;">
                        <div style="height: 100%; width: ${confidence}%; background: linear-gradient(90deg, var(--color-primary), var(--color-gold)); border-radius: 10px;"></div>
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--color-gold);">${confidence.toFixed(1)}%</div>
                    <div style="font-size: 11px; color: var(--color-text-secondary); text-align: center; margin-top: 4px;">${reason || ''}</div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="text-align: center; color: var(--color-text-secondary);">Không có dữ liệu</p>';
    },

    /**
     * Update dashboard stats
     */
    updateDashboardStats(stats) {
        const { totalDays, hottestNumber, coldestNumber, coldestDays } = stats;
        const latestResult = Storage.getLatestResult();

        const latestDateEl = document.getElementById('latestDate');
        const hottestEl = document.getElementById('hottestNumber');
        const coldestEl = document.getElementById('coldestNumber');
        const totalDaysEl = document.getElementById('totalDays');

        if (latestDateEl) latestDateEl.textContent = latestResult?.ngay || '--/--/----';
        if (hottestEl) hottestEl.textContent = hottestNumber || '--';
        if (coldestEl) coldestEl.textContent = coldestNumber ? `${coldestNumber} (${coldestDays}d)` : '--';
        if (totalDaysEl) totalDaysEl.textContent = `${totalDays} ngày`;
    },

    /**
     * Update status badge
     */
    updateStatusBadge(status, text) {
        const badge = document.getElementById('statusBadge');
        if (!badge) return;

        badge.className = 'badge';
        if (status === 'success') badge.classList.add('badge-success');
        else if (status === 'warning') badge.classList.add('badge-warning');
        else badge.classList.add('badge-info');

        badge.textContent = text;
    },

    /**
     * Show loading spinner
     */
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '<div class="loading-spinner"></div>';
    },

    /**
     * Render VIP Golden Picks
     */
    renderVipPicks(predictions) {
        const container = document.getElementById('vipSection');
        if (!container || predictions.length < 3) return;

        const top3 = predictions.slice(0, 3);

        container.innerHTML = `
            <div class="golden-ticket">
                <div class="vip-badge">VIP ACCESS</div>
                <div class="ticket-content">
                    <div class="ticket-header">✨ BẠCH THỦ VÀNG HÔM NAY ✨</div>
                    
                    <div class="vip-numbers-row">
                        ${top3.map((p, i) => `
                            <div class="vip-number-group">
                                <div class="vip-number">${p.number}</div>
                                <div class="vip-label">#${i + 1} Uy tín</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="ticket-footer">
                        <div class="ticket-stat">
                            <span>🎯</span> Độ tin cậy: <strong style="color: #fff">${top3[0].confidence.toFixed(1)}%</strong>
                        </div>
                        <div class="ticket-stat">
                            <span>🤖</span> AI: <strong style="color: #fff">Markov + Poisson</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render Trend Chart for Top 1 Number
     */
    renderTrendChart(predictions) {
        const canvas = document.getElementById('trendChart');
        if (!canvas || predictions.length === 0) return;

        const topNumber = predictions[0].number;
        const ctx = canvas.getContext('2d');

        // Get history of this number for last 10 days
        const results = Storage.getResultsByDays(10).reverse(); // Oldest first
        const labels = results.map(r => r.ngay.slice(0, 5)); // DD/MM
        const data = results.map(r => {
            const nums = API.extractNumbers(r.ket_qua);
            return nums.includes(topNumber) ? 1 : 0;
        });

        const trendData = [];
        for (let i = 0; i < results.length; i++) {
            // Provide a visual trend. If it hit, spike up. If miss, decay.
            // Mocking a "Sentiment Score" for the number
            let score = 50;
            if (data[i] === 1) score = 90;
            else score = 50 - (i * 2) + Math.random() * 20; // Random fluctuation
            trendData.push(score);
        }

        // Destroy existing chart if any
        if (window.trendChartInstance) {
            window.trendChartInstance.destroy();
        }

        window.trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Phong độ số ${topNumber}`,
                    data: trendData,
                    borderColor: '#FFD700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#FFD700',
                    pointRadius: 5,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e2e8f0' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
};
