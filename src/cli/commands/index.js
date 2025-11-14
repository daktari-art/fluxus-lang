// FILENAME: src/cli/commands/index.js
// Command Registry for Fluxus CLI

import { RunCommand } from './RunCommand.js';
import { CompileCommand } from './CompileCommand.js';
import { TestCommand } from './TestCommand.js';

export const COMMAND_REGISTRY = {
    'run': RunCommand,
    'compile': CompileCommand,
    'test': TestCommand
};

export { RunCommand, CompileCommand, TestCommand };
export default COMMAND_REGISTRY;
