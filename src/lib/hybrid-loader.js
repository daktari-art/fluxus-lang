// FILENAME: src/lib/hybrid-loader.js
// Fluxus Library Loader - COMPLETE FIX

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FluxusLibraryLoader {
    constructor(engine) {
        this.engine = engine;
        this.loadedLibraries = new Map();
    }
    
    async loadLibrary(libraryName) {
        if (this.loadedLibraries.has(libraryName)) {
            return this.loadedLibraries.get(libraryName);
        }
        
        console.log(`📚 Loading library: ${libraryName}`);
        
        try {
            const jsOperators = await this.loadJSLibrary(libraryName);
            if (jsOperators) {
                this.loadedLibraries.set(libraryName, jsOperators);
                console.log(`   ✅ Loaded: ${libraryName} (${Object.keys(jsOperators).length} ops)`);
                return jsOperators;
            }
            
            console.log(`   ⚠️ No operators found: ${libraryName}`);
            return {};
            
        } catch (error) {
            console.error(`❌ Failed to load library ${libraryName}:`, error.message);
            return {};
        }
    }
    
    async loadJSLibrary(libraryName) {
        const paths = [
            `./${libraryName}/${libraryName}.js`,
            `./${libraryName}/index.js`,
            `./core/${libraryName}.js`,
            `./math/${libraryName}.js`, 
            `./text/${libraryName}.js`,
            `./time/${libraryName}.js`,
            `./reactive/${libraryName}.js`,
            `./data/${libraryName}.js`
        ];
        
        for (const libPath of paths) {
            try {
                const fullPath = path.join(__dirname, libPath);
                if (!fs.existsSync(fullPath)) continue;
                
                const libraryUrl = pathToFileURL(fullPath).href;
                const module = await import(libraryUrl);
                
                // Try ALL possible export patterns
                const operators = 
                    module[`${libraryName.toUpperCase()}_OPERATORS`] ||
                    module[`${libraryName}_OPERATORS`] ||
                    module.OPERATORS ||
                    module.default ||
                    module;
                
                if (operators && Object.keys(operators).length > 0) {
                    return operators;
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    }
    
    getLoadedLibraries() {
        return Array.from(this.loadedLibraries.keys());
    }
}
