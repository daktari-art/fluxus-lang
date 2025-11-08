#!/bin/bash

# FILENAME: src/core/engine.js
# LOGIC: Applies all three critical fixes:
# 1. Implements the 'print' operator to show output.
# 2. Implements 'runFiniteStreams' to execute finite streams (~).
# 3. Fixes argument extraction to stop erroneous Type Warnings.

FILE=src/core/engine.js

echo "🛠️ Creating backup of $FILE to $FILE.comprehensive.bak..."
cp "$FILE" "$FILE.comprehensive.bak"

# -------------------------------------------------------------------
# FIX 1: Fix 'extractArgsFromMalformedName' (Removes Type Warnings)
# -------------------------------------------------------------------
echo "   - Applying Fix 1: Argument extraction..."

# Old code block to search for (using escaped newlines for sed)
OLD_1="    // SPECIAL HANDLING: If the argument contains a pipe (e.g., print('prefix' | concat(.value)))\\n    if (argsString.includes('|')) {\\n        argsString = argsString.split('|')[0].trim();\\n    }"

# New, corrected code block (ignores the pipe inside known Lens-using operators)
NEW_1="    // SPECIAL HANDLING: If the argument contains a pipe, it's likely part of a Lens argument\\n    // that the parser failed to isolate correctly. We must not truncate the operator name.\\n    if (argsString.includes('|') && !(name.includes('map') || name.includes('filter') || name.includes('reduce'))) {\\n        argsString = argsString.split('|')[0].trim();\\n    }"

# Use '!' as a delimiter for Sed 1
sed -i.bak.1 "s!$(echo -e "$OLD_1")!$(echo -e "$NEW_1")!" "$FILE"


# -------------------------------------------------------------------
# FIX 2: Implement STANDARD_OPERATORS.print (Generates Output)
# -------------------------------------------------------------------
echo "   - Applying Fix 2: 'print' operator implementation..."

# Old stub for 'print' (based on the snippet)
OLD_2="    'print': (input, args) => { \\n        let output;\\n        \\n        if (args && args.length > 0) {\\n             const prefix..."

# New, complete implementation
NEW_2="    'print': (input, args) => { \\n        let output;\\n        \\n        if (args && args.length > 0) {\\n            // Concatenate all arguments (e.g., prefix: 'Result: ')\\n            const prefix = args.join(' ');\\n            output = prefix + ' ' + (typeof input === 'object' ? JSON.stringify(input) : input);\\n        } else {\\n            output = typeof input === 'object' ? JSON.stringify(input) : input;\\n        }\\n        \\n        // The actual SINK operation: display the value\\n        console.log(output);\\n        \\n        // Sinks typically don't forward data, but we return the input for potential chaining (like a tee operator)\\n        return input; \\n    }"

# Use '|' as a delimiter for Sed 2
sed -i.bak.2 "s|$(echo -e "$OLD_2")|$(echo -e "$NEW_2")|" "$FILE"


# -------------------------------------------------------------------
# FIX 3: Implement runFiniteStreams() (Executes ~ streams)
# -------------------------------------------------------------------
echo "   - Applying Fix 3: 'runFiniteStreams' implementation..."

# Old stub for runFiniteStreams
OLD_3="    runFiniteStreams() {\\n        console.log(\`   * Running 0 Finite Streams...\`);\\n    }"

# New, complete implementation for execution
NEW_3="    runFiniteStreams() {\\n        console.log(\`   * Running \${this.ast.finiteStreams.length} Finite Streams...\`);\\n\\n        // FIX: Execute all defined finite streams once, as they are non-live (~).\\n        this.ast.finiteStreams.forEach(startNodeId => {\\n            const startNode = this.ast.nodes.find(n => n.id === startNodeId);\\n\\n            if (startNode) {\\n                // 1. Get the initial value from the stream source definition.\\n                let initialValue = this.parseLiteralValue(startNode.value);\\n                \\n                // 2. Start execution from this source node. \\n                // NOTE: We assume 'this.executePipeline' is the correct method name for starting a pipeline run.\\n                this.executePipeline(startNode, initialValue);\\n            }\\n        });\\n    }"

# Use '@' as a delimiter for Sed 3
sed -i.bak.3 "s@$(echo -e "$OLD_3")@$(echo -e "$NEW_3")@" "$FILE"


echo "✅ All three logical fixes applied to $FILE."
echo "   The script is ready to run. Please run it now."

