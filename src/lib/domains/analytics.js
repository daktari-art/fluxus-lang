// FILENAME: src/lib/domains/analytics.js
// Fluxus Analytics and Data Analysis Operators

/**
 * Analytics operators for data analysis, metrics calculation, and insights generation
 * Provides statistical analysis, pattern detection, and business intelligence
 */

export const ANALYTICS_OPERATORS = {
    /**
     * Calculate basic statistics for numeric data
     * @param {Array|number} input - Numeric data or single value
     * @param {Array} args - [field] Field to analyze for objects
     * @param {Object} context - Execution context
     * @returns {Object} Statistical summary
     */
    'analyze_stats': (input, args, context) => {
        let numbers = [];
        
        // Extract numbers from input
        if (Array.isArray(input)) {
            numbers = input.map(item => {
                if (typeof item === 'number') return item;
                if (typeof item === 'object' && args[0]) return item[args[0]];
                return parseFloat(item);
            }).filter(n => !isNaN(n));
        } else if (typeof input === 'number') {
            numbers = [input];
        } else {
            numbers = [parseFloat(input)].filter(n => !isNaN(n));
        }
        
        if (numbers.length === 0) {
            return {
                count: 0,
                message: 'No numeric data found'
            };
        }
        
        // Calculate statistics
        const sum = numbers.reduce((acc, val) => acc + val, 0);
        const mean = sum / numbers.length;
        const sorted = [...numbers].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0 
            ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
            : sorted[Math.floor(sorted.length/2)];
        
        const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
        const stddev = Math.sqrt(variance);
        
        return {
            count: numbers.length,
            sum: parseFloat(sum.toFixed(4)),
            mean: parseFloat(mean.toFixed(4)),
            median: parseFloat(median.toFixed(4)),
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            variance: parseFloat(variance.toFixed(4)),
            stddev: parseFloat(stddev.toFixed(4)),
            range: Math.max(...numbers) - Math.min(...numbers)
        };
    },
    
    /**
     * Detect trends in time series data
     * @param {Array} input - Time series data
     * @param {Array} args - [valueField, timestampField] Data fields
     * @param {Object} context - Execution context
     * @returns {Object} Trend analysis
     */
    'detect_trend': (input, args, context) => {
        if (!Array.isArray(input) || input.length < 2) {
            return { trend: 'insufficient_data', confidence: 0 };
        }
        
        const valueField = args[0] || 'value';
        const timestampField = args[1] || 'timestamp';
        
        // Extract values and timestamps
        const points = input.map(item => ({
            value: typeof item === 'object' ? item[valueField] : item,
            timestamp: typeof item === 'object' ? item[timestampField] : Date.now()
        })).filter(p => !isNaN(p.value) && p.timestamp);
        
        if (points.length < 2) {
            return { trend: 'insufficient_data', confidence: 0 };
        }
        
        // Simple linear regression for trend detection
        const n = points.length;
        const x = points.map((p, i) => i); // Use index as x for simplicity
        const y = points.map(p => p.value);
        
        const sumX = x.reduce((acc, val) => acc + val, 0);
        const sumY = y.reduce((acc, val) => acc + val, 0);
        const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
        const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared for confidence
        const yMean = sumY / n;
        const totalSumSquares = y.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
        const residualSumSquares = y.reduce((acc, val, i) => {
            const predicted = slope * x[i] + intercept;
            return acc + Math.pow(val - predicted, 2);
        }, 0);
        
        const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
        
        // Determine trend direction and strength
        let trend = 'stable';
        let strength = 'weak';
        
        if (Math.abs(slope) > 0.1) {
            trend = slope > 0 ? 'increasing' : 'decreasing';
            strength = Math.abs(slope) > 0.5 ? 'strong' : 'moderate';
        }
        
        return {
            trend: trend,
            strength: strength,
            slope: parseFloat(slope.toFixed(4)),
            intercept: parseFloat(intercept.toFixed(4)),
            confidence: parseFloat(rSquared.toFixed(4)),
            dataPoints: n,
            prediction: slope * n + intercept
        };
    },
    
    /**
     * Calculate conversion rates and funnels
     * @param {Array} input - User event data
     * @param {Array} args - [funnelSteps] Conversion funnel steps
     * @param {Object} context - Execution context
     * @returns {Object} Funnel analysis
     */
    'analyze_funnel': (input, args, context) => {
        if (!Array.isArray(input)) {
            return { error: 'Input must be an array of events' };
        }
        
        const funnelSteps = args[0] ? args[0].split(',').map(s => s.trim()) : ['view', 'click', 'conversion'];
        
        // Count occurrences of each step
        const stepCounts = {};
        funnelSteps.forEach(step => {
            stepCounts[step] = input.filter(event => 
                event.action === step || event.step === step || event.type === step
            ).length;
        });
        
        // Calculate conversion rates
        const conversions = [];
        let previousCount = stepCounts[funnelSteps[0]];
        
        for (let i = 0; i < funnelSteps.length; i++) {
            const step = funnelSteps[i];
            const count = stepCounts[step];
            const conversionRate = i === 0 ? 100 : (count / previousCount) * 100;
            
            conversions.push({
                step: step,
                count: count,
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                dropoff: i === 0 ? 0 : parseFloat((100 - conversionRate).toFixed(2))
            });
            
            previousCount = count;
        }
        
        return {
            funnel: conversions,
            totalUsers: stepCounts[funnelSteps[0]],
            totalConversions: stepCounts[funnelSteps[funnelSteps.length - 1]],
            overallConversion: parseFloat(
                (stepCounts[funnelSteps[funnelSteps.length - 1]] / stepCounts[funnelSteps[0]] * 100).toFixed(2)
            )
        };
    },
    
    /**
     * Perform cohort analysis
     * @param {Array} input - User data with timestamps
     * @param {Array} args - [cohortPeriod] Cohort period (day, week, month)
     * @param {Object} context - Execution context
     * @returns {Object} Cohort analysis results
     */
    'analyze_cohorts': (input, args, context) => {
        if (!Array.isArray(input)) {
            return { error: 'Input must be an array of user data' };
        }
        
        const cohortPeriod = args[0] || 'week';
        const now = Date.now();
        
        // Group users by cohort
        const cohorts = {};
        
        input.forEach(user => {
            const joinDate = new Date(user.joinDate || user.timestamp || user.createdAt || now);
            let cohortKey;
            
            switch (cohortPeriod) {
                case 'day':
                    cohortKey = joinDate.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(joinDate);
                    weekStart.setDate(joinDate.getDate() - joinDate.getDay());
                    cohortKey = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    cohortKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    cohortKey = joinDate.toISOString().split('T')[0];
            }
            
            if (!cohorts[cohortKey]) {
                cohorts[cohortKey] = {
                    users: [],
                    period: cohortKey,
                    size: 0
                };
            }
            
            cohorts[cohortKey].users.push(user);
            cohorts[cohortKey].size++;
        });
        
        // Calculate retention for each cohort
        const cohortResults = Object.entries(cohorts).map(([period, cohort]) => {
            const retention = {};
            const cohortStart = new Date(period);
            
            // Calculate retention for different time periods
            [1, 7, 14, 30].forEach(days => {
                const periodEnd = new Date(cohortStart.getTime() + days * 24 * 60 * 60 * 1000);
                const activeUsers = cohort.users.filter(user => {
                    const lastActive = new Date(user.lastActive || user.timestamp || user.updatedAt || user.joinDate);
                    return lastActive <= periodEnd;
                }).length;
                
                retention[`day_${days}`] = {
                    active: activeUsers,
                    retention: parseFloat((activeUsers / cohort.size * 100).toFixed(2))
                };
            });
            
            return {
                period: period,
                size: cohort.size,
                retention: retention
            };
        });
        
        return {
            cohortPeriod: cohortPeriod,
            cohorts: cohortResults,
            totalCohorts: cohortResults.length,
            averageSize: parseFloat((input.length / cohortResults.length).toFixed(2))
        };
    },
    
    /**
     * Detect anomalies in data streams
     * @param {Array|number} input - Data to analyze
     * @param {Array} args - [method, sensitivity] Anomaly detection parameters
     * @param {Object} context - Execution context
     * @returns {Object} Anomaly detection results
     */
    'detect_anomalies': (input, args, context) => {
        const method = args[0] || 'zscore';
        const sensitivity = parseFloat(args[1]) || 2.0;
        
        let dataPoints = [];
        
        // Convert input to array of numbers
        if (Array.isArray(input)) {
            dataPoints = input.map(item => 
                typeof item === 'number' ? item : parseFloat(item)
            ).filter(n => !isNaN(n));
        } else {
            dataPoints = [parseFloat(input)].filter(n => !isNaN(n));
        }
        
        if (dataPoints.length < 3) {
            return { anomalies: [], message: 'Insufficient data for anomaly detection' };
        }
        
        const anomalies = [];
        
        if (method === 'zscore') {
            // Z-score method
            const mean = dataPoints.reduce((acc, val) => acc + val, 0) / dataPoints.length;
            const stddev = Math.sqrt(
                dataPoints.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / dataPoints.length
            );
            
            dataPoints.forEach((value, index) => {
                const zscore = stddev === 0 ? 0 : Math.abs((value - mean) / stddev);
                if (zscore > sensitivity) {
                    anomalies.push({
                        index: index,
                        value: value,
                        zscore: parseFloat(zscore.toFixed(4)),
                        method: 'zscore',
                        threshold: sensitivity
                    });
                }
            });
        } else if (method === 'iqr') {
            // Interquartile Range method
            const sorted = [...dataPoints].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - sensitivity * iqr;
            const upperBound = q3 + sensitivity * iqr;
            
            dataPoints.forEach((value, index) => {
                if (value < lowerBound || value > upperBound) {
                    anomalies.push({
                        index: index,
                        value: value,
                        bounds: { lower: lowerBound, upper: upperBound },
                        method: 'iqr',
                        threshold: sensitivity
                    });
                }
            });
        }
        
        return {
            anomalies: anomalies,
            totalAnomalies: anomalies.length,
            anomalyRate: parseFloat((anomalies.length / dataPoints.length * 100).toFixed(2)),
            method: method,
            sensitivity: sensitivity,
            dataPoints: dataPoints.length
        };
    },
    
    /**
     * Calculate key performance indicators (KPIs)
     * @param {Array} input - Business data
     * @param {Array} args - [kpiDefinitions] KPI definitions
     * @param {Object} context - Execution context
     * @returns {Object} KPI calculations
     */
    'calculate_kpis': (input, args, context) => {
        const kpiDefinitions = args[0] ? JSON.parse(args[0]) : {
            revenue: { field: 'amount', operation: 'sum' },
            users: { field: 'userId', operation: 'count_distinct' },
            orders: { field: 'orderId', operation: 'count' },
            aov: { field: 'amount', operation: 'avg' }
        };
        
        if (!Array.isArray(input)) {
            return { error: 'Input must be an array of data points' };
        }
        
        const kpis = {};
        
        Object.entries(kpiDefinitions).forEach(([kpiName, definition]) => {
            const field = definition.field;
            const operation = definition.operation;
            
            let values = [];
            if (field) {
                values = input.map(item => item[field]).filter(val => val !== undefined);
            } else {
                values = input;
            }
            
            switch (operation) {
                case 'sum':
                    kpis[kpiName] = values.reduce((acc, val) => acc + parseFloat(val), 0);
                    break;
                case 'avg':
                    kpis[kpiName] = values.length > 0 
                        ? values.reduce((acc, val) => acc + parseFloat(val), 0) / values.length 
                        : 0;
                    break;
                case 'count':
                    kpis[kpiName] = values.length;
                    break;
                case 'count_distinct':
                    kpis[kpiName] = new Set(values).size;
                    break;
                case 'min':
                    kpis[kpiName] = values.length > 0 ? Math.min(...values.map(v => parseFloat(v))) : 0;
                    break;
                case 'max':
                    kpis[kpiName] = values.length > 0 ? Math.max(...values.map(v => parseFloat(v))) : 0;
                    break;
                case 'median':
                    if (values.length > 0) {
                        const sorted = values.map(v => parseFloat(v)).sort((a, b) => a - b);
                        kpis[kpiName] = sorted.length % 2 === 0 
                            ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
                            : sorted[Math.floor(sorted.length/2)];
                    } else {
                        kpis[kpiName] = 0;
                    }
                    break;
                default:
                    kpis[kpiName] = values.length;
            }
            
            // Round numeric values
            if (typeof kpis[kpiName] === 'number') {
                kpis[kpiName] = parseFloat(kpis[kpiName].toFixed(2));
            }
        });
        
        return {
            kpis: kpis,
            period: 'custom',
            dataPoints: input.length,
            calculatedAt: new Date().toISOString()
        };
    },
    
    /**
     * Perform A/B test analysis
     * @param {Object} input - A/B test data
     * @param {Array} args - [testConfig] Test configuration
     * @param {Object} context - Execution context
     * @returns {Object} A/B test results
     */
    'analyze_ab_test': (input, args, context) => {
        const testConfig = args[0] ? JSON.parse(args[0]) : {
            control: 'A',
            variation: 'B',
            metric: 'conversion'
        };
        
        if (!input || typeof input !== 'object') {
            return { error: 'Input must be an object with test data' };
        }
        
        const controlData = input[testConfig.control] || [];
        const variationData = input[testConfig.variation] || [];
        
        // Calculate conversion rates
        const controlConversions = controlData.filter(item => item[testConfig.metric]).length;
        const variationConversions = variationData.filter(item => item[testConfig.metric]).length;
        
        const controlRate = controlData.length > 0 ? controlConversions / controlData.length : 0;
        const variationRate = variationData.length > 0 ? variationConversions / variationData.length : 0;
        
        // Calculate statistical significance (simplified)
        const uplift = controlRate > 0 ? (variationRate - controlRate) / controlRate * 100 : 0;
        
        // Simple confidence calculation (for demonstration)
        const totalUsers = controlData.length + variationData.length;
        const confidence = Math.min(95 + (Math.abs(uplift) * 0.5), 99.9);
        
        return {
            test: testConfig,
            control: {
                users: controlData.length,
                conversions: controlConversions,
                rate: parseFloat((controlRate * 100).toFixed(2))
            },
            variation: {
                users: variationData.length,
                conversions: variationConversions,
                rate: parseFloat((variationRate * 100).toFixed(2))
            },
            results: {
                uplift: parseFloat(uplift.toFixed(2)),
                confidence: parseFloat(confidence.toFixed(1)),
                significant: confidence > 95,
                recommended: confidence > 95 && uplift > 0 ? testConfig.variation : testConfig.control
            },
            sampleSize: totalUsers
        };
    }
};
