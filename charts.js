// ========================================
// Chart Rendering Module (using Chart.js)
// ========================================

const Charts = {
    instances: {},

    /**
     * Destroy existing chart instance
     * @param {string} chartId - Chart canvas ID
     */
    destroyChart(chartId) {
        if (this.instances[chartId]) {
            this.instances[chartId].destroy();
            delete this.instances[chartId];
        }
    },

    /**
     * Render frequency bar chart
     * @param {Array} frequencyData - Array of {number, count} objects
     * @param {number} topN - Number of top items to show
     */
    renderFrequencyChart(frequencyData, topN = 30) {
        const chartId = 'frequencyChart';
        this.destroyChart(chartId);

        const ctx = document.getElementById(chartId);
        if (!ctx) return;

        const topData = frequencyData.slice(0, topN);
        const labels = topData.map(d => d.number);
        const counts = topData.map(d => d.count);

        // Create gradient
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.4)');

        this.instances[chartId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lần xuất hiện',
                    data: counts,
                    backgroundColor: gradient,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(19, 24, 41, 0.9)',
                        titleColor: '#e2e8f0',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(99, 102, 241, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                const item = topData[context.dataIndex];
                                return [
                                    `Số lần: ${item.count}`,
                                    `Tỷ lệ: ${item.percentage}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(99, 102, 241, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    /**
     * Render heatmap chart showing frequency over time
     * @param {number} days - Number of days to show
     */
    renderHeatmap(days = 20) {
        const chartId = 'heatmapChart';
        this.destroyChart(chartId);

        const ctx = document.getElementById(chartId);
        if (!ctx) return;

        const results = Storage.getResultsByDays(days);

        // Create dataset: each result is a point
        const data = [];
        results.forEach((result, dayIndex) => {
            const numbers = API.getUniqueNumbers(result.ket_qua);
            numbers.forEach(num => {
                data.push({
                    x: dayIndex,
                    y: parseInt(num),
                    r: 5
                });
            });
        });

        this.instances[chartId] = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Số xuất hiện',
                    data: data,
                    backgroundColor: 'rgba(255, 107, 107, 0.6)',
                    borderColor: 'rgba(255, 107, 107, 1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(19, 24, 41, 0.9)',
                        titleColor: '#e2e8f0',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(99, 102, 241, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const num = String(context.raw.y).padStart(2, '0');
                                const daysAgo = context.raw.x;
                                return `Số ${num} - ${daysAgo} ngày trước`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 99,
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 10
                        },
                        grid: {
                            color: 'rgba(99, 102, 241, 0.1)'
                        },
                        title: {
                            display: true,
                            text: 'Số (00-99)',
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        reverse: true,
                        ticks: {
                            color: '#94a3b8',
                            callback: (value) => `${value} ngày trước`
                        },
                        grid: {
                            color: 'rgba(99, 102, 241, 0.1)'
                        },
                        title: {
                            display: true,
                            text: 'Thời gian',
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
};
