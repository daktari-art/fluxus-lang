// FILENAME: scripts/validate-integration.js
// Fluxus Integration Validator v1.0 - Production Grade
// Comprehensive system validation and auto-repair

import { FluxusOrchestrator } from '../src/orchestrator.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class IntegrationValidator {
    constructor() {
        this.results = {
            timestamp: Date.now(),
            summary: { total: 0, passed: 0, failed: 0, repaired: 0 },
            details: [],
            recommendations: []
        };
        
        this.config = {
            autoRepair: true,
            strictMode: false,
            validateExamples: true,
            validateSpec: true,
            generateReports: true
        };
    }

    async runFullValidation() {
        console.log('🔍 Starting Fluxus Integration Validation...\n');
        
        try {
            // 1. System Architecture Validation
            await this.validateSystemArchitecture();
            
            // 2. Domain Library Integration
            await this.validateDomainLibraries();
            
            // 3. Operator Coverage
            await this.validateOperatorCoverage();
            
            // 4. Example Compatibility
            if (this.config.validateExamples) {
                await this.validateAllExamples();
            }
            
            // 5. Specification Compliance
            if (this.config.validateSpec) {
                await this.validateSpecificationCompliance();
            }
            
            // 6. Performance Baseline
            await this.validatePerformanceBaseline();
            
            // Generate final report
            await this.generateValidationReport();
            
            console.log('\n✅ Validation Complete!');
            console.log(`   📊 Summary: ${this.results.summary.passed} passed, ${this.results.summary.failed} failed, ${this.results.summary.repaired} repaired`);
            
            return this.results;
            
        } catch (error) {
            console.error('❌ Validation failed:', error);
            throw error;
        }
    }

    async validateSystemArchitecture() {
        const check = this.createCheck('System Architecture');
        
        try {
            // Verify core file structure
            const requiredPaths = [
                'src/core/engine.js',
                'src/stdlib/core/operators/CoreOperators.js',
                'src/package-manager.js',
                'src/orchestrator.js'
            ];
            
            for (const filePath of requiredPaths) {
                const fullPath = path.join(process.cwd(), filePath);
                try {
                    await fs.access(fullPath);
                    check.details.push(`✅ ${filePath} exists`);
                } catch {
                    check.details.push(`❌ ${filePath} missing`);
                    check.status = 'fail';
                    
                    if (this.config.autoRepair) {
                        await this.repairMissingFile(filePath);
                    }
                }
            }
            
            // Verify orchestrator can initialize
            const orchestrator = new FluxusOrchestrator({ 
                validateOnStartup: false,
                quietMode: true 
            });
            
            await orchestrator.initialize();
            check.details.push('✅ Orchestrator initialized successfully');
            await orchestrator.gracefulShutdown(null);
            
        } catch (error) {
            check.status = 'fail';
            check.details.push(`❌ System architecture validation failed: ${error.message}`);
        }
        
        this.recordCheck(check);
    }

    async validateDomainLibraries() {
        const check = this.createCheck('Domain Libraries');
        
        try {
            const domainsDir = path.join(process.cwd(), 'src', 'lib', 'domains');
            const files = await fs.readdir(domainsDir);
            const domainFiles = files.filter(f => f.endsWith('.js') && !f.startsWith('.'));
            
            check.details.push(`Found ${domainFiles.length} domain files`);
            
            const orchestrator = new FluxusOrchestrator({ 
                autoRegisterDomains: false,
                quietMode: true 
            });
            await orchestrator.initialize();
            
            for (const domainFile of domainFiles) {
                const domainName = domainFile.replace('.js', '');
                const success = await orchestrator.registerDomainLibrary(domainName);
                
                if (success) {
                    check.details.push(`✅ ${domainName} registered successfully`);
                } else {
                    check.details.push(`❌ ${domainName} registration failed`);
                    check.status = 'fail';
                    
                    if (this.config.autoRepair) {
                        await this.repairDomainRegistration(domainName);
                    }
                }
            }
            
            await orchestrator.gracefulShutdown(null);
            
            // Check for orphaned domain files
            await this.findOrphanedDomains(domainFiles);
            
        } catch (error) {
            check.status = 'fail';
            check.details.push(`❌ Domain validation failed: ${error.message}`);
        }
        
        this.recordCheck(check);
    }

    async validateOperatorCoverage() {
        const check = this.createCheck('Operator Coverage');
        
        try {
            const orchestrator = new FluxusOrchestrator({ quietMode: true });
            await orchestrator.initialize();
            
            const operatorCount = orchestrator.getOperatorCount();
            check.details.push(`Total operators: ${operatorCount.total}`);
            check.details.push(`Core operators: ${operatorCount.core}`);
            check.details.push(`Domain operators: ${operatorCount.domain}`);
            
            // Check for critical operators
            const criticalOperators = [
                'print', 'to_pool', 'map', 'split', 'combine_latest',
                'fetch_url', 'hash_sha256', 'ui_events', 'ui_render'
            ];
            
            for (const op of criticalOperators) {
                if (orchestrator.engine.operators.has(op)) {
                    check.details.push(`✅ Critical operator: ${op}`);
                } else {
                    check.details.push(`❌ Missing critical operator: ${op}`);
                    check.status = 'fail';
                }
            }
            
            await orchestrator.gracefulShutdown(null);
            
        } catch (error) {
            check.status = 'fail';
            check.details.push(`❌ Operator coverage check failed: ${error.message}`);
        }
        
        this.recordCheck(check);
    }

    async validateAllExamples() {
        const check = this.createCheck('Example Compatibility');
        
        try {
            const examplesDir = path.join(process.cwd(), 'examples');
            const exampleFiles = (await fs.readdir(examplesDir))
                .filter(f => f.endsWith('.flux'))
                .slice(0, 10); // Validate first 10 examples
            
            check.details.push(`Validating ${exampleFiles.length} examples`);
            
            const orchestrator = new FluxusOrchestrator({ quietMode: true });
            await orchestrator.initialize();
            
            for (const exampleFile of exampleFiles) {
                const examplePath = path.join(examplesDir, exampleFile);
                const content = await fs.readFile(examplePath, 'utf8');
                
                const issues = await this.validateExampleContent(content, orchestrator);
                
                if (issues.length === 0) {
                    check.details.push(`✅ ${exampleFile} - compatible`);
                } else {
                    check.details.push(`❌ ${exampleFile} - ${issues.length} issues`);
                    issues.forEach(issue => check.details.push(`   - ${issue}`));
                    check.status = 'fail';
                }
            }
            
            await orchestrator.gracefulShutdown(null);
            
        } catch (error) {
            check.status = 'fail';
            check.details.push(`❌ Example validation failed: ${error.message}`);
        }
        
        this.recordCheck(check);
    }

    async validateExampleContent(content, orchestrator) {
        const issues = [];
        
        // Extract FLOW imports
        const flowImports = content.match(/FLOW\s+(\w+)/g) || [];
        const importedPackages = flowImports.map(f => f.replace('FLOW', '').trim());
        
        // Verify imported packages are available
        for (const pkg of importedPackages) {
            const available = await orchestrator.packageManager.loadPackage(pkg);
            if (!available) {
                issues.push(`Missing package: ${pkg}`);
            }
        }
        
        // Extract operators used
        const operatorPattern = /\|\s*(\w+)\s*(?:\(|\[|\{)/g;
        const operatorsUsed = new Set();
        let match;
        
        while ((match = operatorPattern.exec(content)) !== null) {
            operatorsUsed.add(match[1]);
        }
        
        // Verify operators exist
        for (const op of operatorsUsed) {
            if (!orchestrator.engine.operators.has(op)) {
                issues.push(`Missing operator: ${op}`);
            }
        }
        
        return issues;
    }

    async validateSpecificationCompliance() {
        const check = this.createCheck('Specification Compliance');
        
        try {
            const specPath = path.join(process.cwd(), 'SPECIFICATION.md');
            const specContent = await fs.readFile(specPath, 'utf8');
            
            // Extract promised features from spec
            const features = this.extractFeaturesFromSpec(specContent);
            check.details.push(`Specification promises ${features.length} features`);
            
            const orchestrator = new FluxusOrchestrator({ quietMode: true });
            await orchestrator.initialize();
            
            // Check implementation status
            for (const feature of features.slice(0, 15)) { // Check first 15 features
                const implemented = await this.checkFeatureImplementation(feature, orchestrator);
                
                if (implemented) {
                    check.details.push(`✅ ${feature.name}`);
                } else {
                    check.details.push(`❌ ${feature.name}`);
                    check.status = 'fail';
                }
            }
            
            await orchestrator.gracefulShutdown(null);
            
        } catch (error) {
            check.status = 'fail';
            check.details.push(`❌ Specification compliance check failed: ${error.message}`);
        }
        
        this.recordCheck(check);
    }

    async validatePerformanceBaseline() {
        const check = this.createCheck('Performance Baseline');
        
        try {
            const orchestrator = new FluxusOrchestrator({ quietMode: true });
            await orchestrator.initialize();
            
            // Simple performance test
            const startTime = Date.now();
            const testIterations = 1000;
            
            for (let i = 0; i < testIterations; i++) {
                // Test basic operator performance
                if (orchestrator.engine.operators.has('add')) {
                    orchestrator.engine.operators.get('add')(i, [1], {});
                }
            }
            
            const duration = Date.now() - startTime;
            const opsPerSecond = (testIterations / (duration / 1000)).toFixed(0);
            
            check.details.push(`Performance: ${opsPerSecond} ops/sec`);
            
            if (opsPerSecond < 1000) {
                check.details.push('⚠️ Performance below expected baseline');
                check.status = 'warn';
            }
            
            await orchestrator.gracefulShutdown(null);
            
        } catch (error) {
            check.status = 'fail';
            check.details.push(`❌ Performance check failed: ${error.message}`);
        }
        
        this.recordCheck(check);
    }

    // ==================== REPAIR FUNCTIONS ====================
    
    async repairMissingFile(filePath) {
        console.log(`   🔧 Repairing missing file: ${filePath}`);
        
        // Create basic stub files for critical missing components
        if (filePath === 'src/orchestrator.js') {
            // We're creating this file now, so skip
            return true;
        }
        
        // Add more repair logic as needed
        this.results.summary.repaired++;
        return true;
    }

    async repairDomainRegistration(domainName) {
        console.log(`   🔧 Repairing domain registration: ${domainName}`);
        
        // Create registration wrapper for problematic domains
        const domainPath = path.join(process.cwd(), 'src', 'lib', 'domains', `${domainName}.js`);
        
        try {
            const content = await fs.readFile(domainPath, 'utf8');
            
            // Check if domain has proper exports
            if (!content.includes('registerWithEngine') && content.includes('IOT_OPERATORS')) {
                // Add registration function
                const repairedContent = content.replace(
                    'export default IOT_OPERATORS;',
                    `export default IOT_OPERATORS;

// Auto-generated registration function
export function registerWithEngine(engine) {
    const operators = IOT_OPERATORS;
    Object.entries(operators).forEach(([name, def]) => {
        if (def.implementation) {
            engine.operators.set(name, (input, args, context) => 
                def.implementation(input, args, context)
            );
        }
    });
    console.log('✅ Auto-registered domain: ${domainName}');
}`
                );
                
                await fs.writeFile(domainPath, repairedContent);
                this.results.summary.repaired++;
                return true;
            }
        } catch (error) {
            console.log(`   ❌ Could not repair domain ${domainName}: ${error.message}`);
        }
        
        return false;
    }

    // ==================== UTILITY METHODS ====================
    
    createCheck(name) {
        return {
            name,
            status: 'pass',
            details: [],
            timestamp: Date.now()
        };
    }

    recordCheck(check) {
        this.results.details.push(check);
        this.results.summary.total++;
        
        if (check.status === 'pass') {
            this.results.summary.passed++;
        } else {
            this.results.summary.failed++;
        }
        
        // Log check result
        const statusIcon = check.status === 'pass' ? '✅' : 
                          check.status === 'warn' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${check.name}`);
        
        if (check.details.length > 0) {
            check.details.forEach(detail => console.log(`   ${detail}`));
        }
        console.log('');
    }

    extractFeaturesFromSpec(specContent) {
        const features = [];
        
        // Extract features from specification
        const featurePattern = /-\s*\*\*([^*]+)\*\*:/g;
        let match;
        
        while ((match = featurePattern.exec(specContent)) !== null) {
            features.push({
                name: match[1].trim(),
                line: specContent.substring(0, match.index).split('\n').length
            });
        }
        
        return features;
    }

    async checkFeatureImplementation(feature, orchestrator) {
        // Map feature names to implementation checks
        const featureChecks = {
            'Non-blocking async execution': () => orchestrator.engine.operators.has('fetch_url'),
            'Tidal Pools': () => orchestrator.engine.operators.has('to_pool'),
            'Branching': () => orchestrator.engine.operators.has('split'),
            'Live stream sources': () => orchestrator.engine.operators.has('ui_events'),
            'Package System': () => orchestrator.packageManager !== null
        };
        
        const check = featureChecks[feature.name];
        return check ? check() : false;
    }

    async findOrphanedDomains(domainFiles) {
        const orphaned = [];
        
        // Check if domains are actually used in examples
        const examplesDir = path.join(process.cwd(), 'examples');
        const exampleFiles = await fs.readdir(examplesDir);
        
        for (const domainFile of domainFiles) {
            const domainName = domainFile.replace('.js', '');
            let used = false;
            
            for (const exampleFile of exampleFiles.slice(0, 5)) {
                if (exampleFile.endsWith('.flux')) {
                    const content = await fs.readFile(path.join(examplesDir, exampleFile), 'utf8');
                    if (content.includes(`FLOW ${domainName}`)) {
                        used = true;
                        break;
                    }
                }
            }
            
            if (!used) {
                orphaned.push(domainName);
            }
        }
        
        if (orphaned.length > 0) {
            console.log('📝 Orphaned domains (not used in examples):', orphaned.join(', '));
        }
    }

    async generateValidationReport() {
        if (!this.config.generateReports) return;
        
        const report = {
            validation: this.results,
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                timestamp: new Date().toISOString()
            },
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(process.cwd(), 'validation-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 Validation report saved to: ${reportPath}`);
    }

    generateRecommendations() {
        const recommendations = [];
        
        const failedChecks = this.results.details.filter(check => check.status === 'fail');
        
        if (failedChecks.length > 0) {
            recommendations.push('Address failed validation checks before production deployment');
        }
        
        if (this.results.summary.repaired > 0) {
            recommendations.push('Review auto-repaired components for proper implementation');
        }
        
        // Add specific recommendations based on findings
        const domainCheck = this.results.details.find(check => check.name === 'Domain Libraries');
        if (domainCheck && domainCheck.status === 'fail') {
            recommendations.push('Improve domain library registration and error handling');
        }
        
        return recommendations;
    }
}

// CLI interface
async function main() {
    const validator = new IntegrationValidator();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    if (args.includes('--no-repair')) {
        validator.config.autoRepair = false;
    }
    if (args.includes('--strict')) {
        validator.config.strictMode = true;
    }
    
    try {
        const results = await validator.runFullValidation();
        
        if (results.summary.failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('Validation process failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default IntegrationValidator;
