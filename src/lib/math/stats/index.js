// FILENAME: src/lib/math/stats/index.js
// Fluxus Math Statistics Library Index

import { STATS_OPERATORS } from '../stats.js';

// Additional specialized statistical operators can be added here
export const STATS_INDEX = {
    name: 'fluxus_stats',
    version: '4.0.0',
    description: 'Advanced statistical operations for Fluxus',
    operators: ['mean', 'median', 'stddev', 'variance', 'correlation', 'regression']
};

// Export individual stats functions for direct import
export const mean = STATS_OPERATORS.mean.implementation;
export const median = STATS_OPERATORS.median.implementation;
export const sum = STATS_OPERATORS.sum.implementation;
export const stddev = STATS_OPERATORS.stddev.implementation;
export const variance = STATS_OPERATORS.variance.implementation;
export const average = STATS_OPERATORS.average.implementation;
export const max_value = STATS_OPERATORS.max_value.implementation;
export const min_value = STATS_OPERATORS.min_value.implementation;

export const Statistics = STATS_OPERATORS;
