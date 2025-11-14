#!/bin/bash
echo "Restoring Fluxus core files from backup..."
cp engine.js.backup ../src/core/engine.js
cp compiler.js.backup ../src/core/compiler.js
cp parser.js.backup ../src/core/parser.js
cp cli.js.backup ../src/cli.js
cp RunCommand.js.backup ../src/cli/commands/RunCommand.js
cp CoreOperators.js.backup ../src/stdlib/core/operators/CoreOperators.js
cp MathOperators.js.backup ../src/stdlib/core/operators/MathOperators.js
cp StringOperators.js.backup ../src/stdlib/core/operators/StringOperators.js
cp operators-index.js.backup ../src/stdlib/core/operators/index.js
echo "✅ Restore complete!"
