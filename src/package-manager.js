// FILENAME: src/package-manager.js
// Fluxus Package Manager - Fixed for Local Use

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FluxusPackageManager {
    constructor() {
        this.packagesDir = path.join(process.cwd(), 'fluxus_packages');
        this.installedPackages = new Map();
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
            version: '1.0.0',
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
}
