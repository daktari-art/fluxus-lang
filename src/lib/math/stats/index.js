// FILENAME: src/lib/math/stats/index.js
// Fluxus Math Statistics Library Index

export * from '../stats.js';
// Additional specialized statistical operators can be added here

export const STATS_INDEX = {
    name: 'fluxus_stats',
    version: '4.0.0',
    description: 'Advanced statistical operations for Fluxus',
    operators: ['mean', 'median', 'stddev', 'variance', 'correlation', 'regression']
};
