// ========================================
// API Integration Module - xoso188.net
// ========================================

const API = {
    ENDPOINT: 'https://xoso188.net/api/front/open/lottery/history/list/game',
    GAME_CODE: 'miba', // Miền Bắc

    /**
     * Fetch latest XSMB results from API
     * @param {number} limitNum - Number of recent results to fetch
     * @returns {Promise<Object>} Result object
     */
    async fetchLatest(limitNum = 30) {
        try {
            const url = `${this.ENDPOINT}?limitNum=${limitNum}&gameCode=${this.GAME_CODE}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status}`);
            }

            const data = await response.json();

            // Validate response structure
            if (!data.success || !data.t || !data.t.issueList) {
                throw new Error('Invalid response format');
            }

            // Convert to our internal format
            const results = data.t.issueList.map(issue => this.parseIssue(issue)).filter(r => r !== null);

            return {
                success: true,
                data: results,
                metadata: {
                    name: data.t.name,
                    code: data.t.code,
                    serverTime: data.t.serverTime
                }
            };
        } catch (error) {
            console.error('API fetch error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Parse issue data to our internal format
     * @param {Object} issue - Issue object from API
     * @returns {Object} Normalized result object
     */
    parseIssue(issue) {
        // Parse detail JSON string
        let detailArray = [];
        try {
            detailArray = JSON.parse(issue.detail);
        } catch (e) {
            console.error('Error parsing detail:', e);
            return null;
        }

        // Map to Vietnamese prize names
        const ket_qua = {
            'giai-db': detailArray[0] ? [detailArray[0]] : [],
            'giai-nhat': detailArray[1] ? [detailArray[1]] : [],
            'giai-nhi': detailArray[2] ? detailArray[2].split(',') : [],
            'giai-ba': detailArray[3] ? detailArray[3].split(',') : [],
            'giai-tu': detailArray[4] ? detailArray[4].split(',') : [],
            'giai-nam': detailArray[5] ? detailArray[5].split(',') : [],
            'giai-sau': detailArray[6] ? detailArray[6].split(',') : [],
            'giai-bay': detailArray[7] ? detailArray[7].split(',') : []
        };

        return {
            ngay: issue.turnNum,
            ket_qua: ket_qua,
            openTime: issue.openTime,
            openNum: issue.openNum
        };
    },

    /**
     * Fetch and save latest results
     * @returns {Promise<Object>} Operation result
     */
    async fetchAndSave() {
        const result = await this.fetchLatest(30);

        if (result.success && result.data) {
            // Save all results
            let savedCount = 0;
            result.data.forEach(item => {
                if (item && Storage.saveResult(item)) {
                    savedCount++;
                }
            });

            return {
                success: savedCount > 0,
                data: result.data[0], // Return latest
                message: `Đã cập nhật ${savedCount} kết quả`,
                metadata: result.metadata
            };
        }

        return {
            success: false,
            error: result.error,
            message: 'Không thể lấy dữ liệu từ API'
        };
    },

    /**
     * Extract all 2-digit numbers from result
     * @param {Object} ketQua - ket_qua object from API
     * @returns {Array<string>} Array of 2-digit numbers
     */
    extractNumbers(ketQua) {
        const numbers = [];

        // Process each prize category
        Object.values(ketQua).forEach(prizeArray => {
            if (Array.isArray(prizeArray)) {
                prizeArray.forEach(num => {
                    const numStr = String(num).trim();
                    if (!numStr) return;

                    // Standard Rule: Only take the last 2 digits for Loto
                    if (numStr.length >= 2) {
                        numbers.push(numStr.slice(-2));
                    }
                });
            }
        });

        return numbers;
    },

    /**
     * Get unique 2-digit numbers from a result
     * @param {Object} ketQua - ket_qua object
     * @returns {Array<string>} Array of unique 2-digit numbers
     */
    getUniqueNumbers(ketQua) {
        const numbers = this.extractNumbers(ketQua);
        return [...new Set(numbers)].sort();
    }
};
