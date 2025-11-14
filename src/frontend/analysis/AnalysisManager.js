// FILENAME: src/frontend/analysis/AnalysisManager.js
// Analysis Manager coordinating all frontend analysis

import { SymbolTable } from './SymbolTable.js';
import { TypeChecker } from './TypeChecker.js';

export class AnalysisManager {
    constructor(compiler) {
        this.compiler = compiler;
        this.symbolTable = new SymbolTable();
        this.typeChecker = new TypeChecker(compiler);
        this.analyses = new Map();
    }

    registerAnalysis(name, analysis) {
        this.analyses.set(name, analysis);
    }

    async analyzeProgram(ast, options = {}) {
        const results = {
            symbols: null,
            types: null,
            customAnalyses: {},
            errors: [],
            warnings: []
        };

        try {
            // Phase 1: Symbol Analysis
            if (options.analyzeSymbols !== false) {
                results.symbols = this.symbolTable.toJSON();
            }

            // Phase 2: Type Checking
            if (options.analyzeTypes !== false) {
                const typeResult = this.typeChecker.checkProgram(ast);
                results.types = typeResult;
                results.errors.push(...typeResult.errors);
                results.warnings.push(...typeResult.warnings);
            }

            // Phase 3: Custom Analyses
            if (options.runCustomAnalyses) {
                for (const [name, analysis] of this.analyses) {
                    try {
                        results.customAnalyses[name] = await analysis.analyze(ast, this.symbolTable);
                    } catch (error) {
                        results.errors.push({
                            analysis: name,
                            error: error.message
                        });
                    }
                }
            }

        } catch (error) {
            results.errors.push({
                phase: 'analysis-manager',
                error: error.message
            });
        }

        return results;
    }

    generateAnalysisReport(analysisResults) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalErrors: analysisResults.errors.length,
                totalWarnings: analysisResults.warnings.length,
                symbolCount: analysisResults.symbols?.symbols?.length || 0,
                typeIssues: analysisResults.types?.errors?.length || 0
            },
            details: analysisResults
        };

        return report;
    }

    printAnalysisReport(analysisResults) {
        const report = this.generateAnalysisReport(analysisResults);
        
        console.log('\n🔍 FLUXUS PROGRAM ANALYSIS REPORT');
        console.log('=' .repeat(50));
        
        console.log(`\n📊 SUMMARY:`);
        console.log(`  Errors: ${report.summary.totalErrors}`);
        console.log(`  Warnings: ${report.summary.totalWarnings}`);
        console.log(`  Symbols: ${report.summary.symbolCount}`);
        console.log(`  Type Issues: ${report.summary.typeIssues}`);
        
        if (analysisResults.errors.length > 0) {
            console.log(`\n❌ ERRORS:`);
            analysisResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.message}`);
                if (error.position) {
                    console.log(`     at line ${error.position.line}, column ${error.position.column}`);
                }
            });
        }
        
        if (analysisResults.warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS:`);
            analysisResults.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning.message}`);
            });
        }
        
        if (analysisResults.symbols) {
            console.log(`\n📝 SYMBOLS:`);
            const pools = analysisResults.symbols.symbols?.filter(s => s.isPool) || [];
            const streams = analysisResults.symbols.symbols?.filter(s => s.isStream) || [];
            
            console.log(`  Pools: ${pools.length}`);
            pools.forEach(pool => console.log(`    - ${pool.name}`));
            
            console.log(`  Streams: ${streams.length}`);
            streams.forEach(stream => console.log(`    - ${stream.name}`));
        }
        
        console.log(`\n✅ Analysis completed at: ${report.timestamp}`);
    }
}

export default AnalysisManager;
