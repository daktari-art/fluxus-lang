// FILENAME: src/stdlib/core/operators/UIOperators.js
// Fluxus UI Library — Compliant with operator registry interface

import { ui_events } from './ui/ui_events.js';

export class UIOperators {
  static getOperators() {
    return {
      ui_events: {
        implementation: ui_events,
        type: 'async_source',
        description: 'Reactive stream from UI events (clicks, input changes, etc.)',
        arity: 2,
        isAsyncSource: true
      }
    };
  }

  static executeOperator(operatorName, input, args, context) {
    const ops = this.getOperators();
    if (!ops[operatorName]) {
      throw new Error(`UI operator not found: ${operatorName}`);
    }
    // ui_events is a source operator; it ignores input and uses args only
    return ops[operatorName].implementation(...args);
  }
}
