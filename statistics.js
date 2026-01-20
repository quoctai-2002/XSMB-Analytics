// ========================================
// Advanced Statistical Analysis Module (Professional Edition)
// ========================================

const Statistics = {

    // cache for expensive calculations
    _cache: {},

    /**
     * core: extract all numbers from a single result
     */
    _extract(result) {
        if (!result || !result.ket_qua) return [];
        return API.extractNumbers(result.ket_qua);
    },

    /**
     * 1. MARKOV CHAIN ANALYSIS
     * Calculates the probability of each number appearing in the NEXT draw
     * based on the numbers that appeared in the CURRENT draw.
     * @param {Array} currentNumbers - The numbers from the most recent draw
     * @param {number} samples - How many past draws to train on (default 365)
     * @returns {Object} Probability map { "00": 0.15, "01": 0.02, ... }
     */
    analyzeMarkovProbabilities(currentNumbers, samples = 365) {
        const results = Storage.getResultsByDays(samples);
        if (results.length < 2) return {};

        // 1. Build Transition Matrix: [PrevNum] -> { [NextNum]: Count }
        const transitions = {};

        // Train matrix
        for (let i = 1; i < results.length; i++) {
            const prevDraw = this._extract(results[i]);     // older (i is index, 0 is newest) -> wait, 0 is newest. 
            // In results array, 0 is today, 1 is yesterday.
            // Transition is Yesterday(1) -> Today(0).
            const nextDraw = this._extract(results[i - 1]);

            prevDraw.forEach(prevNum => {
                if (!transitions[prevNum]) transitions[prevNum] = { total: 0, nextCounts: {} };
                transitions[prevNum].total++;

                nextDraw.forEach(nextNum => {
                    if (!transitions[prevNum].nextCounts[nextNum]) transitions[prevNum].nextCounts[nextNum] = 0;
                    transitions[prevNum].nextCounts[nextNum]++;
                });
            });
        }

        // 2. Calculate Probabilities for tomorrow based on TODAY'S numbers (currentNumbers)
        const combinedProbabilities = {}; // { "00": 0.0, ... }
        // Initialize
        for (let i = 0; i < 100; i++) combinedProbabilities[String(i).padStart(2, '0')] = 0;

        // For each number that appeared today, add its transition probabilities to the potential targets
        currentNumbers.forEach(todayNum => {
            const state = transitions[todayNum];
            if (state && state.total > 0) {
                // For each number that has historically followed 'todayNum'
                Object.entries(state.nextCounts).forEach(([nextNum, count]) => {
                    const prob = count / state.total;
                    // Add weighted probability. 
                    // If multiple numbers from today point to same target, probabilities accumulate.
                    // We normalize later.
                    combinedProbabilities[nextNum] += prob;
                });
            }
        });

        return combinedProbabilities;
    },

    /**
     * 2. POISSON DISTRIBUTION
     * Calculates probability of "k" occurrences in next draw based on detailed average rate.
     * We want P(X >= 1) = 1 - e^(-lambda)
     */
    analyzePoissonProbabilities(samples = 100) {
        const results = Storage.getResultsByDays(samples);
        const counts = {};
        for (let i = 0; i < 100; i++) counts[String(i).padStart(2, '0')] = 0;

        let totalDraws = results.length;
        if (totalDraws === 0) return counts;

        // Count per draw (not total occurrences, but draws containing the number)
        results.forEach(res => {
            const nums = new Set(this._extract(res));
            nums.forEach(n => counts[n]++);
        });

        const probabilities = {};
        Object.entries(counts).forEach(([num, count]) => {
            const lambda = count / totalDraws; // Average rate per draw
            // Probability of appearing at least once in next draw
            const p = 1 - Math.exp(-lambda);
            probabilities[num] = p;
        });

        return probabilities;
    },

    /**
     * 3. PASCAL / BINOMIAL TREND
     * Simple variance analysis: is the number performing above or below its theoretical mean?
     * @returns {Object} Score map (-100 to +100)
     */
    analyzePatternVariance(samples = 30) {
        const results = Storage.getResultsByDays(samples);
        const theoreticalProb = 27 / 100; // Expected probability per number per draw (approx)
        const expectedCount = samples * theoreticalProb;

        const counts = {};
        results.forEach(res => {
            this._extract(res).forEach(n => counts[n] = (counts[n] || 0) + 1);
        });

        const varianceMap = {};
        for (let i = 0; i < 100; i++) {
            const num = String(i).padStart(2, '0');
            const actual = counts[num] || 0;
            // Standard Deviation approximation
            const stdDev = Math.sqrt(samples * theoreticalProb * (1 - theoreticalProb));
            const zScore = (actual - expectedCount) / stdDev;

            // We want numbers that are "reverting to mean" or "hot streaks"? 
            // Lottery strategy: "Hot" tends to stay hot (clumping).
            varianceMap[num] = zScore;
        }
        return varianceMap;
    },

    /**
     * Helper: Get frequency map
     */
    getFrequencyMap(days) {
        const results = Storage.getResultsByDays(days);
        const freq = {};
        results.forEach(res => {
            this._extract(res).forEach(n => freq[n] = (freq[n] || 0) + 1);
        });
        return freq;
    },

    /**
     * Helper: Get cold info
     */
    getColdMap(maxDays = 100) {
        const results = Storage.getResultsByDays(maxDays);
        const lastSeen = {};
        const map = {}; // { "00": daysSince }

        for (let i = 0; i < 100; i++) map[String(i).padStart(2, '0')] = maxDays;

        for (let i = 0; i < results.length; i++) {
            const nums = this._extract(results[i]);
            nums.forEach(n => {
                if (map[n] === maxDays) map[n] = i;
            });
        }
        return map;
    },

    /**
     * ===============================================
     * MASTER PREDICTION ENGINE (Algorithm V2.0)
     * ===============================================
     */
    generatePredictions(method = 'combined', limit = 20, baseDays = 30) {
        const latestResult = Storage.getLatestResult();
        if (!latestResult) return [];

        const currentNumbers = this._extract(latestResult);

        // --- 1. Calculate MARKOV Weights (Pattern Sequence) ---
        // Weight: 35%
        const markovProbs = this.analyzeMarkovProbabilities(currentNumbers, 365);

        // --- 2. Calculate POISSON Weights (Statistical Probability) ---
        // Weight: 25%
        const poissonProbs = this.analyzePoissonProbabilities(baseDays * 3); // Look back 3x window

        // --- 3. Calculate FREQUENCY/VARIANCE (Hot/Throughput) ---
        // Weight: 20%
        const varianceMap = this.analyzePatternVariance(baseDays); // Z-scores

        // --- 4. Calculate COLD/CYCLE Weights (Reversion) ---
        // Weight: 20%
        const coldMap = this.getColdMap(100);

        // --- 5. Loto Pattern (Head/Tail) ---
        // Bonus points
        // Re-use logic but simplify implementation inside loop
        const results = Storage.getResultsByDays(baseDays);
        const headFreq = {}; const tailFreq = {};
        results.forEach(res => {
            this._extract(res).forEach(n => {
                headFreq[n[0]] = (headFreq[n[0]] || 0) + 1;
                tailFreq[n[1]] = (tailFreq[n[1]] || 0) + 1;
            });
        });

        // AGGREGATE SCORES
        const finalScores = [];

        for (let i = 0; i < 100; i++) {
            const num = String(i).padStart(2, '0');
            let score = 0;
            const factors = [];
            const debug = {};

            // 1. Markov Score (0-100)
            // markovProbs[num] is roughly 0.0 to 3.0 (sum of probs)
            // Normalize: typically 0.2 is decent. 
            const mRaw = markovProbs[num] || 0;
            const mScore = Math.min(mRaw * 40, 100);
            debug.markov = mScore;

            // 2. Poisson Score (0-100)
            // poissonProbs[num] is 0.0 to 1.0
            const pRaw = poissonProbs[num] || 0;
            const pScore = pRaw * 100;
            debug.poisson = pScore;

            // 3. Variance / Trend Score
            // zScore typically -3 to +3
            const zScore = varianceMap[num] || 0;
            // We favor slightly positive Z (hot) or very negative Z (due variance)?
            // Let's favor Hot Trend:
            const vScore = Math.max(0, zScore * 20); // only positive momentum
            debug.variance = vScore;

            // 4. Cold/Due Score
            const daysSince = coldMap[num];
            // Sweet spot logic: 12-20 days is golden. >30 is risky but high reward.
            let cScore = 0;
            if (daysSince > 10 && daysSince < 25) cScore = 80;
            else if (daysSince >= 25) cScore = 60 + Math.min(daysSince, 30);
            else cScore = 20; // recently appeared
            debug.cold = cScore;

            // COMBINE WEIGHTS
            score += mScore * 0.35;
            score += pScore * 0.25;
            score += vScore * 0.20;
            score += cScore * 0.20;

            // BONUS: Head/Tail Synergy
            const head = num[0]; const tail = num[1];
            const hCount = headFreq[head] || 0;
            const tCount = tailFreq[tail] || 0;
            if (hCount > results.length * 0.8) { score += 10; factors.push('head_trend'); }
            if (tCount > results.length * 0.8) { score += 10; factors.push('tail_trend'); }

            // Determine primary factors for UI
            if (mScore > 60) factors.push('markov_strong');
            if (pScore > 25) factors.push('poisson_high'); // 25% prob is high for 1/100
            if (zScore > 1.5) factors.push('hot_streak');
            if (daysSince > 15) factors.push('cycle_due');
            if (factors.length === 0 && score > 50) factors.push('balanced_high');

            finalScores.push({
                number: num,
                rawScore: score,
                factors: factors,
                debug
            });
        }

        // Sort descending
        finalScores.sort((a, b) => b.rawScore - a.rawScore);

        // Filter / Normalize for Output
        const topN = finalScores.slice(0, limit);
        const maxS = topN[0]?.rawScore || 1;

        return topN.map(item => ({
            number: item.number,
            confidence: Math.min((item.rawScore / maxS) * 98 + 2, 99.9), // normalize top to ~99%
            confidenceLevel: item.rawScore > 70 ? 'high' : item.rawScore > 50 ? 'medium' : 'low',
            reason: this.formatReason(item.factors, item.debug)
        }));
    },

    // -- UI formatting helpers --

    formatReason(factors, debug) {
        const dict = {
            'markov_strong': 'Chuỗi Markov mạnh',
            'poisson_high': 'Xác suất Poisson cao',
            'hot_streak': 'Đang dây đỏ',
            'cycle_due': 'Chu kỳ đẹp',
            'head_trend': 'Cầu đầu đẹp',
            'tail_trend': 'Cầu đuôi đẹp',
            'balanced_high': 'Chỉ số cân bằng'
        };
        // Take top 2 unique reasons
        const u = [...new Set(factors)].map(f => dict[f] || f);
        return u.slice(0, 2).join(' + ');
    },

    // KEEP LEGACY METHODS for compatibility with other tabs
    calculateFrequency(days) {
        // ... simple wrapper ...
        const map = this.getFrequencyMap(days);
        const tot = Object.values(map).reduce((a, b) => a + b, 0);
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => ({ number: k, count: v, percentage: (v / tot * 100).toFixed(2) }));
    },
    analyzeHotNumbers(days, limit) {
        return this.calculateFrequency(days).slice(0, limit);
    },
    analyzeColdNumbers(maxDays) {
        const map = this.getColdMap(maxDays);
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => ({ number: k, daysSince: v, status: v > 10 ? 'cold' : 'recent' }));
    },
    analyzePairs(days, limit) {
        // (Keep original simple logic for pairs tab if needed, 
        // or re-implement. For brevity, I'll assume simple re-implementation or keep it simple)
        const results = Storage.getResultsByDays(days);
        const pairs = {};
        results.forEach(res => {
            const nums = [...new Set(this._extract(res))].sort();
            for (let i = 0; i < nums.length; i++)
                for (let j = i + 1; j < nums.length; j++)
                    pairs[`${nums[i]}-${nums[j]}`] = (pairs[`${nums[i]}-${nums[j]}`] || 0) + 1;
        });
        return Object.entries(pairs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([k, v]) => { const [n1, n2] = k.split('-'); return { num1: n1, num2: n2, count: v }; });
    },

    /**
     * Analyze Loto head/tail patterns (Restored)
     */
    analyzeLotoPatterns(days = 7) {
        const results = Storage.getResultsByDays(days);
        const headCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
        const tailCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

        results.forEach(result => {
            // Reuse internal extract if available or API
            if (!result || !result.ket_qua) return;
            const numbers = API.extractNumbers(result.ket_qua);
            numbers.forEach(num => {
                const head = parseInt(num[0]);
                const tail = parseInt(num[1]);
                if (!isNaN(head)) headCount[head]++;
                if (!isNaN(tail)) tailCount[tail]++;
            });
        });

        // Sort and get top 5
        const hotHeads = Object.entries(headCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([k]) => k);

        const hotTails = Object.entries(tailCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([k]) => k);

        return { hotHeads, hotTails };
    },

    /**
     * Get overall statistics summary (Restored)
     */
    getSummary() {
        const totalDays = Storage.getResultCount();
        const hotNumbers = this.analyzeHotNumbers(7, 1);
        const coldNumbers = this.analyzeColdNumbers(60);

        return {
            totalDays,
            hottestNumber: hotNumbers[0]?.number || '--',
            coldestNumber: coldNumbers[0]?.number || '--',
            coldestDays: coldNumbers[0]?.daysSince || 0
        };
    }
};
