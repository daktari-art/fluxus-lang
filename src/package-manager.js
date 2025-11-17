// FILENAME: src/package-manager.js
// Fluxus Package Manager v2.0 - WITH DOMAIN INTEGRATION

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FluxusPackageManager {
    constructor(engine = null) {
        this.engine = engine;
        this.packagesDir = path.join(process.cwd(), 'fluxus_packages');
        this.installedPackages = new Map();
        this.loadedOperators = new Map();
        this.domainPackages = new Map(); // NEW: Track domain packages
        
        this.loadInstalledPackages();
    }

    // ENHANCED INSTALL WITH DOMAIN SUPPORT
    install(packageName) {
        console.log(`📦 Installing ${packageName}...`);
        
        const packagePath = path.join(this.packagesDir, packageName);
        
        if (!fs.existsSync(this.packagesDir)) {
            fs.mkdirSync(this.packagesDir, { recursive: true });
        }

        if (!fs.existsSync(packagePath)) {
            fs.mkdirSync(packagePath, { recursive: true });
        }

        const operators = this.getPackageOperators(packageName);
        const manifest = {
            name: packageName,
            version: '4.0.0',
            installed: new Date().toISOString(),
            operators: operators,
            description: this.getPackageDescription(packageName),
            type: this.getPackageType(packageName) // NEW: Package type classification
        };

        fs.writeFileSync(
            path.join(packagePath, 'package.json'),
            JSON.stringify(manifest, null, 2)
        );

        this.createPackageImplementation(packageName, packagePath);

        this.installedPackages.set(packageName, manifest);
        this.saveInstalledPackages();

        // NEW: Auto-load domain packages
        if (manifest.type === 'domain' && this.engine) {
            this.loadDomainPackage(packageName);
        }

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
        this.domainPackages.delete(packageName);
        this.saveInstalledPackages();

        console.log(`✅ ${packageName} uninstalled successfully!`);
        return true;
    }

    // ENHANCED LIST WITH DOMAIN INFO
    list() {
        console.log('\n📦 Installed Packages:');
        if (this.installedPackages.size === 0) {
            console.log('  No packages installed');
            console.log('  Install packages with: node src/cli.js install <package-name>');
            return;
        }

        this.installedPackages.forEach((manifest, name) => {
            const typeIcon = manifest.type === 'domain' ? '🏗️' : manifest.type === 'core' ? '⚙️' : '🔧';
            const loadedStatus = this.domainPackages.has(name) ? ' ✅ (loaded)' : ' ⏳ (not loaded)';
            
            console.log(`\n  ${typeIcon} ${name}@${manifest.version}${loadedStatus}`);
            console.log(`    Description: ${manifest.description}`);
            console.log(`    Operators: ${manifest.operators.join(', ')}`);
            console.log(`    Installed: ${new Date(manifest.installed).toLocaleDateString()}`);
        });
    }

    // ENHANCED SEARCH WITH DOMAIN INFO
    search(query) {
        const availablePackages = {
            'http': {
                description: 'HTTP and networking operations',
                operators: ['fetch_url', 'websocket', 'http_server'],
                type: 'core'
            },
            'iot': {
                description: 'Internet of Things device management',
                operators: ['discover_devices', 'read_sensor_data', 'send_command'],
                type: 'domain'
            },
            'health': {
                description: 'Health and fitness tracking',
                operators: ['track_heartrate', 'monitor_steps', 'calculate_bmi'],
                type: 'domain'
            },
            'analytics': {
                description: 'Data analytics and processing',
                operators: ['aggregate_data', 'detect_anomalies', 'calculate_trends'],
                type: 'domain'
            },
            'crypto': {
                description: 'Cryptographic functions',
                operators: ['hash_sha256', 'encrypt', 'decrypt'],
                type: 'core'
            },
            'time': {
                description: 'Time and scheduling utilities',
                operators: ['delay', 'interval', 'timeout'],
                type: 'core'
            }
        };

        console.log(`\n🔍 Searching for packages matching "${query}":`);
        let found = false;
        
        Object.entries(availablePackages).forEach(([name, pkg]) => {
            if (name.includes(query) || pkg.operators.some(op => op.includes(query))) {
                const installed = this.installedPackages.has(name) ? ' ✅ (installed)' : '';
                const typeIcon = pkg.type === 'domain' ? '🏗️' : pkg.type === 'core' ? '⚙️' : '🔧';
                
                console.log(`\n  ${typeIcon} ${name}${installed}`);
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
            'utils': ['uuid', 'timestamp', 'deep_copy', 'type_check'],
            'iot': ['discover_devices', 'connect_device', 'read_sensor_data', 'process_telemetry', 'detect_anomalies_iot', 'send_command', 'update_firmware', 'edge_aggregate', 'local_inference'],
            'health': ['track_heartrate', 'monitor_steps', 'calculate_bmi', 'analyze_sleep'],
            'analytics': ['aggregate_data', 'detect_anomalies', 'calculate_trends', 'predict_values']
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
            'utils': 'Utility functions for common programming tasks',
            'iot': 'Internet of Things device management and sensor data processing',
            'health': 'Health and fitness tracking with biometric analysis',
            'analytics': 'Data analytics, anomaly detection, and trend analysis'
        };

        return descriptions[packageName] || `Operations for ${packageName}`;
    }

    // ENHANCED PACKAGE TYPE DETECTION
    getPackageType(packageName) {
        const domainPackages = ['iot', 'health', 'analytics', 'sensors'];
        const corePackages = ['http', 'crypto', 'time', 'math', 'fs', 'utils'];
        
        if (domainPackages.includes(packageName)) return 'domain';
        if (corePackages.includes(packageName)) return 'core';
        return 'extension';
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
        'uuid': 'Generate a unique identifier',
        'discover_devices': 'Discover IoT devices on the network',
        'read_sensor_data': 'Read data from connected sensors',
        'track_heartrate': 'Monitor and track heart rate data',
        'aggregate_data': 'Aggregate and summarize data streams'
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
            'type_check': 'Check data type',
            'discover_devices': 'Discover IoT devices on network',
            'connect_device': 'Connect to IoT device',
            'read_sensor_data': 'Read sensor data from device',
            'process_telemetry': 'Process telemetry data streams',
            'detect_anomalies_iot': 'Detect anomalies in IoT data',
            'send_command': 'Send command to IoT device',
            'update_firmware': 'Update device firmware',
            'edge_aggregate': 'Aggregate data at edge',
            'local_inference': 'Run local ML inference',
            'track_heartrate': 'Track heart rate metrics',
            'monitor_steps': 'Monitor step count',
            'calculate_bmi': 'Calculate Body Mass Index',
            'analyze_sleep': 'Analyze sleep patterns',
            'aggregate_data': 'Aggregate data streams',
            'detect_anomalies': 'Detect data anomalies',
            'calculate_trends': 'Calculate data trends',
            'predict_values': 'Predict future values'
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
            operators.push(...manifest.operators.map(op => ({
                name: op,
                package: manifest.name,
                type: manifest.type
            })));
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

    // NEW: DOMAIN PACKAGE LOADING
    async loadDomainPackage(packageName) {
        try {
            const packagePath = path.join(this.packagesDir, packageName, 'index.js');
            if (fs.existsSync(packagePath)) {
                const packageUrl = pathToFileURL(packagePath).href;
                const module = await import(packageUrl);
                
                if (module.registerWithEngine && this.engine) {
                    const operators = module.registerWithEngine(this.engine);
                    this.domainPackages.set(packageName, {
                        module,
                        operators,
                        loadedAt: Date.now()
                    });
                    
                    console.log(`✅ Domain package loaded: ${packageName} (${operators.length} operators)`);
                    return true;
                }
            }
        } catch (error) {
            console.error(`❌ Failed to load domain package ${packageName}:`, error.message);
        }
        return false;
    }

    // NEW: DOMAIN MANAGEMENT
    getDomainPackages() {
        const domains = [];
        this.installedPackages.forEach((manifest, name) => {
            if (manifest.type === 'domain') {
                domains.push({
                    name,
                    operators: manifest.operators,
                    isLoaded: this.domainPackages.has(name)
                });
            }
        });
        return domains;
    }

    async loadAllDomainPackages() {
        const domains = this.getDomainPackages();
        const loadPromises = domains.map(domain => 
            this.loadDomainPackage(domain.name)
        );
        
        const results = await Promise.allSettled(loadPromises);
        const loadedCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        
        console.log(`✅ Loaded ${loadedCount}/${domains.length} domain packages`);
        return loadedCount;
    }

    // ENHANCED PACKAGE INFO
    getPackageInfo(packageName) {
        const manifest = this.installedPackages.get(packageName);
        if (!manifest) return null;

        const domainInfo = this.domainPackages.get(packageName);
        
        return {
            ...manifest,
            isDomain: manifest.type === 'domain',
            isLoaded: !!domainInfo,
            loadedAt: domainInfo?.loadedAt,
            operatorCount: manifest.operators.length
        };
    }
}

export default FluxusPackageManager;
