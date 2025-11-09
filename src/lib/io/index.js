// FILENAME: src/lib/io/index.js
// IO Library Main Exports

export { FS_OPERATORS } from './fs.js';
export { PATH_OPERATORS } from './path.js';

export const IO_OPERATORS = {
    ...FS_OPERATORS,
    ...PATH_OPERATORS
};
