// FILENAME: src/package-manager.js
// Fluxus Package Manager - Fixed for Local Use

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FluxusPackageManager {
    constructor() {
        this.packagesDir = path.join(process.cwd(), 'fluxus_packages');
        this.installedPackages = new Map();
        this.loadedOperators = new Map(); // Cache for loaded operator functions
        this.loadInstalledPackages();
    }

    install(packageName) {
        console.log(`📦 Installing ${packageName}...`);
        
        const packagePath = path.join(this.packagesDir, packageName);
        
        if (!fs.existsSync(this.packagesDir)) {
            fs.mkdirSync(this.packagesDir, { recursive: true });
        }

        if (!fs.existsSync(packagePath)) {
            fs.mkdirSync(packagePath, { recursive: true });
        }

        // Create package manifest
        const manifest = {
            name: packageName,
            version: '4.0.0',
            installed: new Date().toISOString(),
            operators: this.getPackageOperators(packageName),
            description: this.getPackageDescription(packageName)
        };

        fs.writeFileSync(
            path.join(packagePath, 'package.json'),
            JSON.stringify(manifest, null, 2)
        );

        // Create a simple operator implementation
        this.createPackageImplementation(packageName, packagePath);

        this.installedPackages.set(packageName, manifest);
        this.saveInstalledPackages();

        console.log(`✅ ${packageName} installed successfully!`);
        console.log(`🔧 Available operators: ${manifest.operators.join(', ')}`);
        console.log(`📚 Usage: FLOW ${packageName}`);
        
        return manifest;
    }

    uninstall(packageName) {
        if (!this.installedPackages.has(packageName)) {
            console.log(`❌ Package ${packageName} is not installed`);
            return false;
        }

        const packagePath = path.join(this.packagesDir, packageName);
        if (fs.existsSync(packagePath)) {
            fs.rmSync(packagePath, { recursive: true });
        }

        this.installedPackages.delete(packageName);
        this.saveInstalledPackages();

        console.log(`✅ ${packageName} uninstalled successfully!`);
        return true;
    }

    list() {
        console.log('\n📦 Installed Packages:');
        if (this.installedPackages.size === 0) {
            console.log('  No packages installed');
            console.log('  Install packages with: node src/cli.js install <package-name>');
            return;
        }

        this.installedPackages.forEach((manifest, name) => {
            console.log(`\n  ${name}@${manifest.version}`);
            console.log(`    Description: ${manifest.description}`);
            console.log(`    Operators: ${manifest.operators.join(', ')}`);
            console.log(`    Installed: ${new Date(manifest.installed).toLocaleDateString()}`);
        });
    }

    search(query) {
        const availablePackages = {
            'http': {
                description: 'HTTP and networking operations',
                operators: ['fetch_url', 'websocket', 'http_server']
            },
            'fs': {
                description: 'File system operations', 
                operators: ['read_file', 'write_file', 'watch_file']
            },
            'crypto': {
                description: 'Cryptographic functions',
                operators: ['hash_sha256', 'encrypt', 'decrypt']
            },
            'time': {
                description: 'Time and scheduling utilities',
                operators: ['delay', 'interval', 'timeout']
            },
            'math': {
                description: 'Advanced mathematical functions',
                operators: ['sin', 'cos', 'random', 'sqrt']
            },
            'utils': {
                description: 'Utility functions',
                operators: ['uuid', 'timestamp', 'deep_copy']
            }
        };

        console.log(`\n🔍 Searching for packages matching "${query}":`);
        let found = false;
        
        Object.entries(availablePackages).forEach(([name, pkg]) => {
            if (name.includes(query) || pkg.operators.some(op => op.includes(query))) {
                const installed = this.installedPackages.has(name) ? ' ✅ (installed)' : '';
                console.log(`\n  ${name}${installed}`);
                console.log(`    ${pkg.description}`);
                console.log(`    Operators: ${pkg.operators.join(', ')}`);
                found = true;
            }
        });

        if (!found) {
            console.log('  No packages found matching your query');
        }
        
        return found;
    }

    getPackageOperators(packageName) {
        const packageOperators = {
            'http': ['fetch_url', 'websocket_stream', 'http_request'],
            'fs': ['read_file', 'write_file', 'list_files'],
            'crypto': ['hash_sha256', 'encrypt_aes', 'generate_key'],
            'time': ['delay_ms', 'interval_ms', 'timeout_ms'],
            'math': ['sin', 'cos', 'tan', 'log', 'exp'],
            'utils': ['uuid', 'timestamp', 'deep_copy', 'type_check']
        };

        return packageOperators[packageName] || [`${packageName}_operator`];
    }

    getPackageDescription(packageName) {
        const descriptions = {
            'http': 'HTTP client and server operations for network communication',
            'fs': 'File system operations for reading and writing files',
            'crypto': 'Cryptographic functions for security operations',
            'time': 'Time-based utilities for scheduling and delays',
            'math': 'Mathematical functions for advanced calculations',
            'utils': 'Utility functions for common programming tasks'
        };

        return descriptions[packageName] || `Operations for ${packageName}`;
    }

    createPackageImplementation(packageName, packagePath) {
        const implementation = `
// Fluxus Package: ${packageName}
// Auto-generated implementation

export const ${packageName.toUpperCase()}_OPERATORS = {
    ${this.getPackageOperators(packageName).map(op => `
    ${op}: {
        name: '${op}',
        description: '${this.getOperatorDescription(op)}',
        implementation: (input, args) => {
            // TODO: Implement ${op} functionality
            console.log('${op} called with:', input, args);
            return input;
        }
    }`).join(',')}
};

function getOperatorDescription(operator) {
    const descriptions = {
        'fetch_url': 'Fetch data from a URL',
        'read_file': 'Read contents from a file',
        'hash_sha256': 'Generate SHA256 hash',
        'delay_ms': 'Delay execution by milliseconds',
        'sin': 'Calculate sine of a number',
        'uuid': 'Generate a unique identifier'
    };
    return descriptions[operator] || 'Operator implementation';
}
`.trim();

        fs.writeFileSync(
            path.join(packagePath, 'index.js'),
            implementation
        );
    }

    getOperatorDescription(operator) {
        const descriptions = {
            'fetch_url': 'Fetch data from a URL',
            'websocket_stream': 'Create a WebSocket stream',
            'http_request': 'Make HTTP requests',
            'read_file': 'Read contents from a file',
            'write_file': 'Write data to a file',
            'list_files': 'List files in directory',
            'hash_sha256': 'Generate SHA256 hash',
            'encrypt_aes': 'Encrypt data with AES',
            'generate_key': 'Generate cryptographic key',
            'delay_ms': 'Delay execution by milliseconds',
            'interval_ms': 'Execute at intervals',
            'timeout_ms': 'Execute after timeout',
            'sin': 'Calculate sine of a number',
            'cos': 'Calculate cosine of a number',
            'tan': 'Calculate tangent of a number',
            'log': 'Calculate logarithm',
            'exp': 'Calculate exponential',
            'uuid': 'Generate a unique identifier',
            'timestamp': 'Get current timestamp',
            'deep_copy': 'Create deep copy of data',
            'type_check': 'Check data type'
        };
        return descriptions[operator] || `${operator} operation`;
    }

    loadInstalledPackages() {
        const configPath = path.join(this.packagesDir, 'installed.json');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.installedPackages = new Map(Object.entries(config.packages || {}));
            } catch (error) {
                console.warn('⚠️ Could not load package configuration');
            }
        }
    }

    saveInstalledPackages() {
        const configPath = path.join(this.packagesDir, 'installed.json');
        const config = {
            packages: Object.fromEntries(this.installedPackages)
        };

        if (!fs.existsSync(this.packagesDir)) {
            fs.mkdirSync(this.packagesDir, { recursive: true });
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    getInstalledOperators() {
        const operators = [];
        this.installedPackages.forEach(manifest => {
            operators.push(...manifest.operators);
        });
        return operators;
    }

    /**
     * Retrieves an operator implementation from an installed package.
     * This method is asynchronous because it may need to dynamically import the package file.
     * @param {string} operatorName 
     * @returns {object | null} The operator object with its implementation, or null.
     */
    async getOperator(operatorName) {
        if (this.loadedOperators.has(operatorName)) {
            return this.loadedOperators.get(operatorName);
        }
        
        // Search through all installed packages to find the operator
        for (const [packageName, manifest] of this.installedPackages.entries()) {
            if (manifest.operators && manifest.operators.includes(operatorName)) {
                // Package contains the operator, now load its code
                await this.loadPackageImplementation(packageName);
                // After loading, the operator should be in the map
                return this.loadedOperators.get(operatorName) || null;
            }
        }
        
        return null;
    }

    /**
     * Dynamically loads all operators from a package's index.js file.
     * @param {string} packageName 
     */
    async loadPackageImplementation(packageName) {
        // Prevent double loading
        if (this.loadedPackages && this.loadedPackages.has(packageName)) {
            return;
        }

        const packageIndexPath = path.join(this.packagesDir, packageName, 'index.js');
        if (fs.existsSync(packageIndexPath)) {
            try {
                // Use dynamic import with file URL path for reliable loading in ES Modules
                const packageUrl = pathToFileURL(packageIndexPath).href;
                const module = await import(packageUrl);
                
                // Expects the file to export FLUXUS_OPERATORS or HTTP_OPERATORS (using OR for flexibility)
                const ops = module.FLUXUS_OPERATORS || module.HTTP_OPERATORS; 
                
                for (const [opName, opDef] of Object.entries(ops)) {
                    this.loadedOperators.set(opName, opDef);
                }
                
                if (!this.loadedPackages) {
                    this.loadedPackages = new Set();
                }
                this.loadedPackages.add(packageName);
                
                console.log(`   📦 Package loaded: ${packageName} (${Object.keys(ops).length} ops)`);
                
            } catch (error) {
                console.error(`❌ Failed to dynamically load package '${packageName}': ${error.message}`);
            }
        }
    }

    // FIXED: Added missing loadPackageOperators method
    async loadPackageOperators(packageName) {
        try {
            const packagePath = path.join(this.packagesDir, packageName, 'index.js');
            if (fs.existsSync(packagePath)) {
                const packageUrl = pathToFileURL(packagePath).href;
                const module = await import(packageUrl);
                
                // Look for standard operator exports
                return module.FLUXUS_OPERATORS || module.HTTP_OPERATORS || module.default || {};
            }
        } catch (error) {
            console.error(`❌ Failed to load package operators for ${packageName}:`, error.message);
        }
        return {};
    }
}
