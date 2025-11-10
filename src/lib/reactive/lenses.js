// FILENAME: src/lib/reactive/lenses.js
// Fluxus Advanced Lens Composition and Transformation Operators

/**
 * Advanced lens operators for complex data transformations
 * Lenses provide functional, composable ways to transform nested data structures
 */

export const LENS_OPERATORS = {
    /**
     * Compose multiple lenses into a single transformation pipeline
     * @param {any} input - Stream input
     * @param {Array} args - [lensExpression] Pipe-separated lens operations
     * @param {Object} context - Execution context
     * @returns {any} Transformed data
     */
    'compose_lenses': (input, args, context) => {
        if (!args || args.length === 0) {
            return input;
        }
        
        const lensExpression = args[0];
        const steps = lensExpression.split('|').map(step => step.trim()).filter(step => step);
        
        let result = input;
        
        for (const step of steps) {
            try {
                // Handle different lens step types
                if (step === '.value') {
                    result = result?.value !== undefined ? result.value : result;
                } 
                else if (step.startsWith('.')) {
                    // Property access: .fieldName
                    const field = step.substring(1);
                    result = result?.[field];
                }
                else if (step.includes('(')) {
                    // Function call: operation(arg)
                    const match = step.match(/(\w+)\(([^)]*)\)/);
                    if (match) {
                        const opName = match[1];
                        const opArgs = match[2].split(',').map(arg => arg.trim()).filter(arg => arg);
                        
                        // Check if operator exists
                        const operator = context.engine.operators[opName];
                        if (operator) {
                            result = operator(result, opArgs, context);
                        } else {
                            console.warn(`⚠️ Unknown operator in lens: ${opName}`);
                        }
                    }
                }
                else {
                    // Simple operator name
                    const operator = context.engine.operators[step];
                    if (operator) {
                        result = operator(result, [], context);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Lens step failed: ${step}`, error.message);
                // Continue with current result on error
            }
        }
        
        return result;
    },
    
    /**
     * Conditional lens application based on predicate
     * @param {any} input - Stream input
     * @param {Array} args - [condition, trueLens, falseLens] Conditional lenses
     * @param {Object} context - Execution context
     * @returns {any} Conditionally transformed data
     */
    'conditional_lens': (input, args, context) => {
        if (!args || args.length < 3) {
            return input;
        }
        
        const [conditionExpr, trueLens, falseLens] = args;
        
        try {
            // Evaluate condition
            let conditionResult = false;
            
            if (conditionExpr.includes('==')) {
                const [left, right] = conditionExpr.split('==').map(s => s.trim());
                const leftValue = this.evaluateLensExpression(input, left, context);
                const rightValue = this.evaluateLiteral(right);
                conditionResult = leftValue == rightValue;
            }
            else if (conditionExpr.includes('!=')) {
                const [left, right] = conditionExpr.split('!=').map(s => s.trim());
                const leftValue = this.evaluateLensExpression(input, left, context);
                const rightValue = this.evaluateLiteral(right);
                conditionResult = leftValue != rightValue;
            }
            else if (conditionExpr.includes('>')) {
                const [left, right] = conditionExpr.split('>').map(s => s.trim());
                const leftValue = parseFloat(this.evaluateLensExpression(input, left, context));
                const rightValue = parseFloat(this.evaluateLiteral(right));
                conditionResult = leftValue > rightValue;
            }
            else if (conditionExpr.includes('<')) {
                const [left, right] = conditionExpr.split('<').map(s => s.trim());
                const leftValue = parseFloat(this.evaluateLensExpression(input, left, context));
                const rightValue = parseFloat(this.evaluateLiteral(right));
                conditionResult = leftValue < rightValue;
            }
            else {
                // Simple truthiness check
                const value = this.evaluateLensExpression(input, conditionExpr, context);
                conditionResult = Boolean(value);
            }
            
            // Apply appropriate lens
            const selectedLens = conditionResult ? trueLens : falseLens;
            return this.evaluateLensExpression(input, selectedLens, context);
            
        } catch (error) {
            console.warn(`⚠️ Conditional lens failed:`, error.message);
            return input;
        }
    },
    
    /**
     * Transform nested object structures using path lenses
     * @param {Object} input - Stream input (object)
     * @param {Array} args - [pathMappings] Object defining path transformations
     * @param {Object} context - Execution context
     * @returns {Object} Transformed object
     */
    'transform_paths': (input, args, context) => {
        if (typeof input !== 'object' || input === null) {
            return input;
        }
        
        if (!args || args.length === 0) {
            return input;
        }
        
        try {
            const pathMappings = JSON.parse(args[0]);
            const result = { ...input };
            
            for (const [targetPath, sourceLens] of Object.entries(pathMappings)) {
                try {
                    const transformedValue = this.evaluateLensExpression(input, sourceLens, context);
                    this.setNestedValue(result, targetPath, transformedValue);
                } catch (error) {
                    console.warn(`⚠️ Path transformation failed for ${targetPath}:`, error.message);
                }
            }
            
            return result;
        } catch (error) {
            console.warn(`⚠️ Path transform lens failed:`, error.message);
            return input;
        }
    },
    
    /**
     * Batch process arrays with individual lens transformations
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [itemLens] Lens to apply to each array item
     * @param {Object} context - Execution context
     * @returns {Array} Transformed array
     */
    'map_lens': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        if (!args || args.length === 0) {
            return input;
        }
        
        const itemLens = args[0];
        
        return input.map(item => {
            try {
                return this.evaluateLensExpression(item, itemLens, context);
            } catch (error) {
                console.warn(`⚠️ Map lens item failed:`, error.message);
                return item;
            }
        });
    },
    
    /**
     * Filter array using lens-based predicate
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [predicateLens] Lens that returns boolean for filtering
     * @param {Object} context - Execution context
     * @returns {Array} Filtered array
     */
    'filter_lens': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        if (!args || args.length === 0) {
            return input;
        }
        
        const predicateLens = args[0];
        
        return input.filter(item => {
            try {
                const result = this.evaluateLensExpression(item, predicateLens, context);
                return Boolean(result);
            } catch (error) {
                console.warn(`⚠️ Filter lens predicate failed:`, error.message);
                return false;
            }
        });
    },
    
    /**
     * Reduce array using lens-based accumulator
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [accumulatorLens, initialValue] Reduction lens
     * @param {Object} context - Execution context
     * @returns {any} Reduced value
     */
    'reduce_lens': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        if (!args || args.length === 0) {
            return input;
        }
        
        const accumulatorLens = args[0];
        let accumulator = args.length > 1 ? this.evaluateLiteral(args[1]) : 0;
        
        return input.reduce((acc, item, index) => {
            try {
                // Create a context with current accumulator and item
                const reduceContext = {
                    ...context,
                    reduceState: {
                        accumulator: acc,
                        currentItem: item,
                        currentIndex: index,
                        array: input
                    }
                };
                
                return this.evaluateLensExpression({ acc, item, index }, accumulatorLens, reduceContext);
            } catch (error) {
                console.warn(`⚠️ Reduce lens step failed:`, error.message);
                return acc;
            }
        }, accumulator);
    },
    
    // Helper methods for lens evaluation
    evaluateLensExpression(data, expression, context) {
        if (!expression || expression === '.') {
            return data;
        }
        
        const steps = expression.split('|').map(step => step.trim()).filter(step => step);
        let result = data;
        
        for (const step of steps) {
            result = this.evaluateLensStep(result, step, context);
        }
        
        return result;
    },
    
    evaluateLensStep(data, step, context) {
        if (step === '.value') {
            return data?.value !== undefined ? data.value : data;
        }
        else if (step.startsWith('.')) {
            const field = step.substring(1);
            return data?.[field];
        }
        else if (step.includes('(')) {
            const match = step.match(/(\w+)\(([^)]*)\)/);
            if (match) {
                const opName = match[1];
                const opArgs = match[2].split(',').map(arg => 
                    this.evaluateLiteral(arg.trim())
                ).filter(arg => arg !== undefined);
                
                const operator = context.engine.operators[opName];
                if (operator) {
                    return operator(data, opArgs, context);
                }
            }
        }
        else {
            const operator = context.engine.operators[step];
            if (operator) {
                return operator(data, [], context);
            }
        }
        
        return data;
    },
    
    evaluateLiteral(value) {
        if (value === 'null') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(value) && value.trim() !== '') return parseFloat(value);
        if ((value.startsWith("'") && value.endsWith("'")) || 
            (value.startsWith('"') && value.endsWith('"'))) {
            return value.slice(1, -1);
        }
        return value;
    },
    
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (current[key] === undefined || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }
};
