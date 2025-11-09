// FILENAME: src/lib/network/http.js
// HTTP Client Operations

export const HTTP_OPERATORS = {
    'http_get': async (input, args) => {
        const url = args[0] || input;
        try {
            console.log(`🌐 HTTP GET: ${url}`);
            // Mock implementation - would use fetch/axios in real implementation
            return {
                status: 200,
                url: url,
                body: `Mock response from ${url}`,
                headers: { 'content-type': 'application/json' }
            };
        } catch (error) {
            return { error: error.message, status: 500 };
        }
    },
    
    'http_post': async (input, args) => {
        const url = args[0];
        const body = args[1] || input;
        try {
            console.log(`🌐 HTTP POST: ${url}`, body);
            return {
                status: 201,
                url: url,
                body: { received: body, id: Math.random().toString(36).substr(2, 9) },
                message: 'Resource created successfully'
            };
        } catch (error) {
            return { error: error.message, status: 500 };
        }
    },
    
    'http_status_check': (input, args) => {
        const expectedStatus = parseInt(args[0]) || 200;
        const isSuccess = input.status === expectedStatus;
        return { ...input, isSuccess, statusMatch: isSuccess };
    },
    
    'parse_json': (input, args) => {
        try {
            if (typeof input.body === 'string') {
                return { ...input, parsed: JSON.parse(input.body) };
            }
            return input;
        } catch (error) {
            return { ...input, error: 'Invalid JSON', original: input.body };
        }
    }
};
