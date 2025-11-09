// FILENAME: src/lib/io/path.js
// Path Manipulation Operations

import path from 'path';

export const PATH_OPERATORS = {
    'path_join': (input, args) => {
        const segments = [input, ...args].filter(Boolean);
        return path.join(...segments);
    },
    
    'path_basename': (input, args) => {
        return path.basename(input);
    },
    
    'path_dirname': (input, args) => {
        return path.dirname(input);
    },
    
    'path_extname': (input, args) => {
        return path.extname(input);
    },
    
    'path_normalize': (input, args) => {
        return path.normalize(input);
    }
};
