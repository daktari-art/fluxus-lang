// FILENAME: src/lib/network/index.js
// Network Library Main Exports

export { HTTP_OPERATORS } from './http.js';
export { WEBSOCKET_OPERATORS } from './websocket.js';

// Combined network operators
export const NETWORK_OPERATORS = {
    ...HTTP_OPERATORS,
    ...WEBSOCKET_OPERATORS
};
