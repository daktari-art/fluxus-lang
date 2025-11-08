#!/bin/bash

# FILENAME: src/core/engine.js
# LOGIC: Fixes the 'extractArgsFromMalformedName' function to correctly handle the Lens block 
#        ({}) and avoid truncating the operator name during type checking, which was 
#        causing the "Operator 'map {.value' is not defined..." warnings.

FILE=src/core/engine.js

echo "🛠️ Creating backup of $FILE to $FILE.bak.2..."
# Create a backup before making any changes.
cp "$FILE" "$FILE.bak.2"

# Define the old function content (used in the sed substitution)
# The string includes escaped newlines for multi-line matching.
OLD_FUNC="    // SPECIAL HANDLING: If the argument contains a pipe (e.g., print('prefix' | concat(.value)))\n    if (argsString.includes('|')) {\n        argsString = argsString.split('|')[0].trim();\n    }\n"

# Define the new, corrected function content.
NEW_FUNC="    // SPECIAL HANDLING: If the argument contains a pipe, it's likely part of a Lens argument\n    // that the parser failed to isolate correctly. We must not truncate the operator name.\n    if (argsString.includes('|') && !(name.includes('map') || name.includes('filter') || name.includes('reduce'))) {\n        argsString = argsString.split('|')[0].trim();\n    }\n"

# Use sed with multi-line substitution to replace the old stub with the new function.
# We use '!' as the delimiter for the 's' command.
sed -i.bak "s!${OLD_FUNC}!${NEW_FUNC}!" "$FILE"

echo "✅ Logic 2: Operator/Argument extraction fix applied in $FILE."
echo "   The script is ready to run. Please run it now."

