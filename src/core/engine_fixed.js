// Enhanced engine with fixed custom operation execution
import { RuntimeEngine as OriginalEngine } from './engine.js';

export class RuntimeEngine extends OriginalEngine {
    executeCustomOperation(funcName, inputData, args) {
        const funcDef = this.ast.functions[funcName];
        if (!funcDef) {
            throw new Error(`Custom operation '${funcName}' not found`);
        }

        console.log(`   🛠️ Executing custom operation: ${funcName}`);
        
        try {
            const funcBody = funcDef.body.trim();
            let processedBody = funcBody;
            
            // Replace .value with inputData
            if (funcBody.includes('.value')) {
                processedBody = processedBody.replace(/\.value/g, 'inputData');
            }
            
            let result;
            if (processedBody.startsWith('return ')) {
                // Body already has return - use without adding return
                const func = new Function('inputData', processedBody);
                result = func(inputData);
            } else {
                // Body doesn't have return - add it
                const func = new Function('inputData', `return ${processedBody}`);
                result = func(inputData);
            }
            
            console.log(`   ✅ ${funcName}(${inputData}) = ${result}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Error executing custom operation '${funcName}': ${error.message}`);
            return inputData;
        }
    }
}
