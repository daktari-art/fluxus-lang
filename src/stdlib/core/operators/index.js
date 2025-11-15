// FILENAME: src/stdlib/core/operators/index.js
// Standard Library Operators Index

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

export function getOperator(operatorName, library = 'core') {
    const lib = StandardLibrary[library];
    if (!lib) {
        throw new Error(`Unknown library: ${library}`);
    }
    const operators = lib.getOperators();
    return operators[operatorName];
}

export function executeOperator(operatorName, input, args = [], context = {}, library = 'core') {
    const lib = StandardLibrary[library];
    if (!lib) {
        throw new Error(`Unknown library: ${library}`);
    }

    // Handle different library method signatures
    if (lib.executeOperator) {
        // CoreOperators and UIOperators expect 4 parameters (with context)
        if (library === 'core' || library === 'ui') {
            return lib.executeOperator(operatorName, input, args, context);
        } else {
            // String and Math operators expect only 3 parameters (no context)
            return lib.executeOperator(operatorName, input, args);
        }
    } else {
        // Fallback: get the operator and call it directly
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
    for (const [libName, libClass] of Object.entries(StandardLibrary)) {
        const operators = libClass.getOperators();
        for (const [opName, opDef] of Object.entries(operators)) {
            allOperators[opName] = {
                ...opDef,
                library: libName
            };
        }
    }
    return allOperators;
}

export class OperatorsRegistry {
    constructor() {
        this.operators = getAllOperators();
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

    generateDocumentation() {
        const operators = getAllOperators();
        const categories = {};
        for (const [name, def] of Object.entries(operators)) {
            const lib = def.library || 'core';
            if (!categories[lib]) categories[lib] = [];
            categories[lib].push({
                name,
                type: def.type,
                description: def.description
            });
        }
        return categories;
    }
}

export default StandardLibrary;
