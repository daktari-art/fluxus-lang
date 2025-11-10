// FILENAME: src/lib/time/date/index.js
// Fluxus Time Date Library Index

// Re-export from main time library
export { 
    format_time, parse_time, time_diff 
} from '../time.js';

export const DATE_OPERATORS = {
    // Additional date-specific operators can be added here
};

export const DATE_INDEX = {
    name: 'fluxus_date',
    version: '4.0.0',
    description: 'Date manipulation and formatting for Fluxus',
    operators: ['format_time', 'parse_time', 'time_diff'] // Current operators
};
