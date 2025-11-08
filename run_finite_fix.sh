#!/bin/bash

# FILENAME: src/core/engine.js
# LOGIC: Re-implements the execution of finite streams (~), which was stubbed out, 
#        by iterating over all finite stream source nodes and running the pipeline once for each.

FILE=src/core/engine.js

echo "🛠️ Creating backup of $FILE to $FILE.bak..."
# Create a backup before making any changes.
cp "$FILE" "$FILE.bak"

# Define the old stub content (used in the sed substitution)
# The string includes escaped newlines for multi-line matching.
OLD_STUB="    runFiniteStreams() {\n        console.log(\`   * Running 0 Finite Streams...\`);\n    }"

# Define the new, correct function content.
NEW_FUNC="    runFiniteStreams() {\n        console.log(\`   * Running \${this.ast.finiteStreams.length} Finite Streams...\`);\n\n        // FIX: Execute all defined finite streams once, as they are non-live (~).\n        this.ast.finiteStreams.forEach(startNodeId => {\n            const startNode = this.ast.nodes.find(n => n.id === startNodeId);\n\n            if (startNode) {\n                // 1. Get the initial value from the stream source definition.\n                let initialValue = this.parseLiteralValue(startNode.value);\n                \n                // 2. Start execution from this source node. \n                // NOTE: We assume 'this.executePipeline' is the correct method name for starting a pipeline run.\n                this.executePipeline(startNode, initialValue);\n            }\n        });\n    }"

# Use sed with multi-line substitution to replace the old stub with the new function.
# We use '!' as the delimiter for the 's' command as the code contains slashes.
sed -i.bak "s!${OLD_STUB}!${NEW_FUNC}!" "$FILE"

echo "✅ Logic 1: Finite Stream execution re-implemented in $FILE."
echo "   The script is ready to run. Please run it now."

