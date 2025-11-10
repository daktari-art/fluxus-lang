// FILENAME: src/lib/hybrid-loader.js
// Fluxus Library Loader - ENGINE-INTEGRATED VERSION

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FluxusLibraryLoader {
    constructor(engine) {
        this.engine = engine;
        this.loadedLibraries = new Map();
        this.libraryCache = new Map(); // Cache successful loads
    }
    
    async loadLibrary(libraryName) {
        // Check cache first
        if (this.libraryCache.has(libraryName)) {
            return this.libraryCache.get(libraryName);
        }
        
        if (this.loadedLibraries.has(libraryName)) {
            return this.loadedLibraries.get(libraryName);
        }
        
        if (this.engine.debugMode) {
            console.log(`📚 Loading library: ${libraryName}`);
        }
        
        try {
            const jsOperators = await this.loadJSLibrary(libraryName);
            if (jsOperators && Object.keys(jsOperators).length > 0) {
                this.loadedLibraries.set(libraryName, jsOperators);
                this.libraryCache.set(libraryName, jsOperators); // Cache successful load
                
                if (this.engine.debugMode) {
                    console.log(`   ✅ Loaded: ${libraryName} (${Object.keys(jsOperators).length} ops)`);
                }
                return jsOperators;
            }
            
            if (this.engine.debugMode) {
                console.log(`   ⚠️ No operators found: ${libraryName}`);
            }
            return {};
            
        } catch (error) {
            if (this.engine.debugMode) {
                console.error(`❌ Failed to load library ${libraryName}:`, error.message);
            }
            return {};
        }
    }
    
    async loadJSLibrary(libraryName) {
        // COMPREHENSIVE LIBRARY PATH MAPPING - PRIORITIZED
        const paths = [
            // Direct library files (highest priority)
            `./${libraryName}.js`,
            `./${libraryName}/index.js`,
            
            // Core libraries
            `./core/${libraryName}.js`,
            `./core/${libraryName}/index.js`,
            
            // Math libraries  
            `./math/${libraryName}.js`,
            `./math/${libraryName}/index.js`,
            `./math/stats/${libraryName}.js`,
            `./math/trig/${libraryName}.js`,
            
            // Text libraries
            `./text/${libraryName}.js`, 
            `./text/${libraryName}/index.js`,
            `./text/regex/${libraryName}.js`,
            `./text/format/${libraryName}.js`,
            
            // Time libraries
            `./time/${libraryName}.js`,
            `./time/${libraryName}/index.js`,
            `./time/date/${libraryName}.js`,
            `./time/scheduler/${libraryName}.js`,
            
            // IO libraries
            `./io/${libraryName}.js`,
            `./io/${libraryName}/index.js`,
            
            // Network libraries
            `./network/${libraryName}.js`,
            `./network/${libraryName}/index.js`,
            
            // Reactive libraries
            `./reactive/${libraryName}.js`,
            `./reactive/${libraryName}/index.js`,
            
            // Data libraries
            `./data/${libraryName}.js`,
            `./data/${libraryName}/index.js`,
            
            // Domain libraries
            `./domains/${libraryName}.js`,
            `./domains/${libraryName}/index.js`
        ];
        
        for (const libPath of paths) {
            try {
                const fullPath = path.join(__dirname, libPath);
                if (!fs.existsSync(fullPath)) {
                    continue; // Skip non-existent paths
                }
                
                const libraryUrl = pathToFileURL(fullPath).href;
                const module = await import(libraryUrl);
                
                // FLEXIBLE EXPORT DETECTION - Handle all patterns
                const operators = 
                    module[`${libraryName.toUpperCase()}_OPERATORS`] ||
                    module[`${libraryName}_OPERATORS`] ||
                    module.OPERATORS ||
                    module.default ||
                    module;
                
                if (operators && typeof operators === 'object' && Object.keys(operators).length > 0) {
                    if (this.engine.debugMode) {
                        console.log(`   📂 Found at: ${libPath}`);
                    }
                    return operators;
                }
            } catch (error) {
                // Silent continue - try next path
                continue;
            }
        }
        
        return null; // No library found
    }
    
    getLoadedLibraries() {
        return Array.from(this.loadedLibraries.keys());
    }
    
    // Get all available libraries (for CLI)
    getAvailableLibraries() {
        return [
            // Core
            'core', 'types', 'collections',
            // Math
            'math', 'stats', 'trig',
            // Text  
            'text', 'string', 'regex', 'format',
            // Time
            'time', 'date', 'scheduler',
            // IO
            'io', 'fs', 'path',
            // Network
            'network', 'http', 'websocket', 'mqtt',
            // Reactive
            'reactive', 'pools', 'subscriptions', 'lenses',
            // Data
            'data', 'streams', 'aggregators', 'transducers',
            // Domains
            'domains', 'sensors', 'ui', 'analytics'
        ];
    }
    
    // Clear cache (for development)
    clearCache() {
        this.libraryCache.clear();
        this.loadedLibraries.clear();
    }
}
