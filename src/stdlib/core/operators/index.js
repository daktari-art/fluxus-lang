// FILENAME: src/stdlib/core/operators/index.js
// Standard Library Operators Index v2.0 - WITH DOMAIN SUPPORT

import { CoreOperators } from './CoreOperators.js';
import { MathOperators } from './MathOperators.js';
import { StringOperators } from './StringOperators.js';
import { UIOperators } from './UIOperators.js';

export const StandardLibrary = {
    core: CoreOperators,
    math: MathOperators,
    string: StringOperators,
    ui: UIOperators
};

// Domain operators registry - CRITICAL MISSING COMPONENT
const domainOperators = new Map();

export function registerDomainOperators(domainName, operators) {
    domainOperators.set(domainName, operators);
    console.log(`✅ Registered ${Object.keys(operators).length} operators from domain: ${domainName}`);
}

export function getDomainOperator(operatorName) {
    for (const [domainName, operators] of domainOperators) {
        if (operators[operatorName]) {
            return {
                ...operators[operatorName],
                library: domainName,
                type: 'domain'
            };
        }
    }
    return null;
}

export function getOperator(operatorName, library = 'core') {
    // First try domains
    const domainOp = getDomainOperator(operatorName);
    if (domainOp) {
        return domainOp;
    }

    // Then try standard libraries
    const lib = StandardLibrary[library];
    if (!lib) {
        throw new Error(`Unknown library: ${library}`);
    }
    const operators = lib.getOperators();
    return operators[operatorName];
}

export function executeOperator(operatorName, input, args = [], context = {}, library = 'core') {
    // First try domains
    const domainOp = getDomainOperator(operatorName);
    if (domainOp && domainOp.implementation) {
        return domainOp.implementation(input, args, context);
    }

    // Then try standard libraries
    const lib = StandardLibrary[library];
    if (!lib) {
        throw new Error(`Unknown library: ${library}`);
    }

    if (lib.executeOperator) {
        if (library === 'core' || library === 'ui') {
            return lib.executeOperator(operatorName, input, args, context);
        } else {
            return lib.executeOperator(operatorName, input, args);
        }
    } else {
        const operators = lib.getOperators();
        const operator = operators[operatorName];
        if (!operator) {
            throw new Error(`Unknown ${library} operator: ${operatorName}`);
        }
        return operator.implementation(input, ...args);
    }
}

export function getAllOperators() {
    const allOperators = {};
    
    // Add standard library operators
    for (const [libName, libClass] of Object.entries(StandardLibrary)) {
        const operators = libClass.getOperators();
        for (const [opName, opDef] of Object.entries(operators)) {
            allOperators[opName] = {
                ...opDef,
                library: libName
            };
        }
    }
    
    // Add domain operators - CRITICAL MISSING COMPONENT
    for (const [domainName, operators] of domainOperators) {
        for (const [opName, opDef] of Object.entries(operators)) {
            allOperators[opName] = {
                ...opDef,
                library: domainName,
                type: 'domain'
            };
        }
    }
    
    return allOperators;
}

export class OperatorsRegistry {
    constructor() {
        this.operators = getAllOperators();
        this.domainRegistry = domainOperators;
    }

    getOperator(name, library = 'core') {
        return getOperator(name, library);
    }

    executeOperator(name, input, args = [], context = {}, library = 'core') {
        return executeOperator(name, input, args, context, library);
    }

    getAllOperators() {
        return getAllOperators();
    }

    // DOMAIN MANAGEMENT METHODS - CRITICAL MISSING COMPONENTS
    registerDomain(domainName, operators) {
        registerDomainOperators(domainName, operators);
        this.operators = getAllOperators(); // Refresh cache
    }

    getDomainOperators(domainName) {
        return domainOperators.get(domainName) || {};
    }

    getDomains() {
        return Array.from(domainOperators.keys());
    }

    generateDocumentation() {
        const operators = getAllOperators();
        const categories = {};
        
        for (const [name, def] of Object.entries(operators)) {
            const lib = def.library || 'core';
            if (!categories[lib]) categories[lib] = [];
            categories[lib].push({
                name,
                type: def.type,
                description: def.description,
                signature: def.signature
            });
        }
        
        return categories;
    }

    // OPERATOR DISCOVERY AND VALIDATION
    validateOperator(operatorName, inputType) {
        const operator = this.getOperator(operatorName);
        if (!operator) {
            return { valid: false, error: `Operator not found: ${operatorName}` };
        }

        if (operator.signature && operator.signature.input) {
            // Basic type checking (simplified)
            if (inputType && operator.signature.input !== 'Any' && inputType !== operator.signature.input) {
                return { 
                    valid: false, 
                    error: `Type mismatch: expected ${operator.signature.input}, got ${inputType}` 
                };
            }
        }

        return { valid: true, operator };
    }

    getOperatorCount() {
        const allOps = this.getAllOperators();
        const domains = this.getDomains();
        
        return {
            total: Object.keys(allOps).length,
            core: Object.keys(StandardLibrary.core.getOperators()).length,
            math: Object.keys(StandardLibrary.math.getOperators()).length,
            string: Object.keys(StandardLibrary.string.getOperators()).length,
            ui: Object.keys(StandardLibrary.ui.getOperators()).length,
            domains: domains.length,
            domainOperators: domains.reduce((sum, domain) => 
                sum + Object.keys(this.getDomainOperators(domain)).length, 0
            )
        };
    }
}

// Singleton instance
export const operatorsRegistry = new OperatorsRegistry();
export default StandardLibrary;
