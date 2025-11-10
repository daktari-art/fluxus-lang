// FILENAME: src/lib/domains/ui.js
// Fluxus User Interface and DOM Operations

/**
 * UI and DOM operators for building reactive user interfaces
 * Provides stream-based DOM manipulation and event handling
 */

export const UI_OPERATORS = {
    /**
     * Render data to DOM element
     * @param {any} input - Data to render
     * @param {Array} args - [selector, template] Target element and template
     * @param {Object} context - Execution context
     * @returns {any} Original input
     */
    'ui_render': (input, args, context) => {
        const selector = args[0];
        const template = args[1] || '{{value}}';
        
        if (typeof document === 'undefined') {
            console.log(`[UI_RENDER] ${selector}: ${JSON.stringify(input)}`);
            return input;
        }
        
        try {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ UI element not found: ${selector}`);
                return input;
            }
            
            // Simple template rendering
            let content = template;
            if (typeof input === 'object' && input !== null) {
                Object.entries(input).forEach(([key, value]) => {
                    content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
                });
            } else {
                content = content.replace(/{{value}}/g, String(input));
            }
            
            element.innerHTML = content;
            
            if (context.engine.debugMode) {
                console.log(`🎨 Rendered to ${selector}:`, input);
            }
            
        } catch (error) {
            console.error(`❌ UI render failed for ${selector}:`, error.message);
        }
        
        return input;
    },
    
    /**
     * Create DOM event stream
     * @param {any} input - Stream input (ignored for source)
     * @param {Array} args - [selector, eventType] DOM element and event type
     * @param {Object} context - Execution context
     * @returns {Object} Event data
     */
    'ui_events': (input, args, context) => {
        const selector = args[0];
        const eventType = args[1] || 'click';
        
        if (typeof document === 'undefined') {
            // Mock implementation for Node.js
            const mockEvent = {
                type: eventType,
                target: selector,
                timestamp: Date.now(),
                mock: true,
                data: 'mock_event_data'
            };
            
            // Simulate occasional events
            if (Math.random() < 0.3) {
                return mockEvent;
            }
            
            return undefined;
        }
        
        // Browser implementation
        if (!context.engine._uiEventListeners) {
            context.engine._uiEventListeners = new Map();
        }
        
        const eventKey = `${selector}_${eventType}`;
        
        // Return a special object indicating this is an event source
        return {
            _fluxusEventSource: true,
            selector: selector,
            eventType: eventType,
            key: eventKey,
            description: `DOM events from ${selector} (${eventType})`
        };
    },
    
    /**
     * Set CSS styles on DOM element
     * @param {any} input - Style data or element reference
     * @param {Array} args - [selector, styles] Target element and styles
     * @param {Object} context - Execution context
     * @returns {any} Original input
     */
    'ui_style': (input, args, context) => {
        const selector = args[0];
        const styles = args[1];
        
        if (typeof document === 'undefined') {
            console.log(`[UI_STYLE] ${selector}: ${styles}`);
            return input;
        }
        
        try {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ UI element not found: ${selector}`);
                return input;
            }
            
            // Parse styles if provided as string
            let styleObj = {};
            if (typeof styles === 'string') {
                try {
                    styleObj = JSON.parse(styles.replace(/(\w+):/g, '"$1":'));
                } catch {
                    // Fallback: assume it's already an object from input
                    styleObj = typeof input === 'object' ? input : {};
                }
            } else if (typeof input === 'object') {
                styleObj = input;
            }
            
            // Apply styles
            Object.assign(element.style, styleObj);
            
            if (context.engine.debugMode) {
                console.log(`🎨 Styled ${selector}:`, styleObj);
            }
            
        } catch (error) {
            console.error(`❌ UI style failed for ${selector}:`, error.message);
        }
        
        return input;
    },
    
    /**
     * Toggle CSS class on DOM element
     * @param {any} input - Toggle state or condition
     * @param {Array} args - [selector, className, condition] Target and class
     * @param {Object} context - Execution context
     * @returns {any} Original input
     */
    'ui_toggle_class': (input, args, context) => {
        const selector = args[0];
        const className = args[1];
        const condition = args[2];
        
        if (typeof document === 'undefined') {
            console.log(`[UI_TOGGLE] ${selector} .${className}: ${condition || input}`);
            return input;
        }
        
        try {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ UI element not found: ${selector}`);
                return input;
            }
            
            // Determine if class should be added
            let shouldAdd = false;
            if (condition !== undefined) {
                shouldAdd = Boolean(condition);
            } else {
                shouldAdd = Boolean(input);
            }
            
            if (shouldAdd) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
            
            if (context.engine.debugMode) {
                console.log(`🎨 Toggled ${selector} .${className}: ${shouldAdd}`);
            }
            
        } catch (error) {
            console.error(`❌ UI toggle class failed for ${selector}:`, error.message);
        }
        
        return input;
    },
    
    /**
     * Update element attributes
     * @param {any} input - Attribute data
     * @param {Array} args - [selector, attributes] Target and attributes
     * @param {Object} context - Execution context
     * @returns {any} Original input
     */
    'ui_attributes': (input, args, context) => {
        const selector = args[0];
        const attributes = args[1];
        
        if (typeof document === 'undefined') {
            console.log(`[UI_ATTRS] ${selector}: ${attributes}`);
            return input;
        }
        
        try {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ UI element not found: ${selector}`);
                return input;
            }
            
            // Parse attributes
            let attrObj = {};
            if (typeof attributes === 'string') {
                try {
                    attrObj = JSON.parse(attributes.replace(/(\w+):/g, '"$1":'));
                } catch {
                    attrObj = typeof input === 'object' ? input : {};
                }
            } else if (typeof input === 'object') {
                attrObj = input;
            }
            
            // Apply attributes
            Object.entries(attrObj).forEach(([key, value]) => {
                element.setAttribute(key, String(value));
            });
            
            if (context.engine.debugMode) {
                console.log(`🎨 Attributes set on ${selector}:`, attrObj);
            }
            
        } catch (error) {
            console.error(`❌ UI attributes failed for ${selector}:`, error.message);
        }
        
        return input;
    },
    
    /**
     * Create reactive form binding
     * @param {any} input - Form data
     * @param {Array} args - [formSelector, fieldMapping] Form and field mapping
     * @param {Object} context - Execution context
     * @returns {Object} Form data
     */
    'ui_form_binding': (input, args, context) => {
        const formSelector = args[0];
        const fieldMapping = args[1];
        
        if (typeof document === 'undefined') {
            console.log(`[UI_FORM] ${formSelector}:`, input);
            return input;
        }
        
        try {
            const form = document.querySelector(formSelector);
            if (!form) {
                console.warn(`⚠️ Form not found: ${formSelector}`);
                return input;
            }
            
            let formData = {};
            
            if (typeof input === 'object' && input !== null) {
                // Update form from data
                Object.entries(input).forEach(([field, value]) => {
                    const element = form.querySelector(`[name="${field}"]`);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = Boolean(value);
                        } else {
                            element.value = String(value);
                        }
                    }
                });
                formData = { ...input };
            } else {
                // Extract data from form
                const formElements = form.elements;
                for (let element of formElements) {
                    if (element.name) {
                        if (element.type === 'checkbox') {
                            formData[element.name] = element.checked;
                        } else {
                            formData[element.name] = element.value;
                        }
                    }
                }
            }
            
            if (context.engine.debugMode) {
                console.log(`📝 Form data for ${formSelector}:`, formData);
            }
            
            return formData;
            
        } catch (error) {
            console.error(`❌ UI form binding failed for ${formSelector}:`, error.message);
            return input;
        }
    },
    
    /**
     * Show/hide DOM elements
     * @param {any} input - Visibility state
     * @param {Array} args - [selector, condition] Target and visibility condition
     * @param {Object} context - Execution context
     * @returns {any} Original input
     */
    'ui_visibility': (input, args, context) => {
        const selector = args[0];
        const condition = args[1];
        
        if (typeof document === 'undefined') {
            console.log(`[UI_VISIBILITY] ${selector}: ${condition || input}`);
            return input;
        }
        
        try {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ UI element not found: ${selector}`);
                return input;
            }
            
            // Determine visibility
            let isVisible = false;
            if (condition !== undefined) {
                isVisible = Boolean(condition);
            } else {
                isVisible = Boolean(input);
            }
            
            element.style.display = isVisible ? '' : 'none';
            
            if (context.engine.debugMode) {
                console.log(`👁️ Visibility ${selector}: ${isVisible ? 'visible' : 'hidden'}`);
            }
            
        } catch (error) {
            console.error(`❌ UI visibility failed for ${selector}:`, error.message);
        }
        
        return input;
    },
    
    /**
     * Create animation stream
     * @param {any} input - Animation data
     * @param {Array} args - [selector, animation] Target and animation properties
     * @param {Object} context - Execution context
     * @returns {any} Animation result
     */
    'ui_animate': (input, args, context) => {
        const selector = args[0];
        const animation = args[1];
        
        if (typeof document === 'undefined') {
            console.log(`[UI_ANIMATE] ${selector}: ${animation}`);
            return input;
        }
        
        try {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ UI element not found: ${selector}`);
                return input;
            }
            
            // Parse animation properties
            let animProps = {};
            if (typeof animation === 'string') {
                try {
                    animProps = JSON.parse(animation);
                } catch {
                    animProps = typeof input === 'object' ? input : {};
                }
            } else if (typeof input === 'object') {
                animProps = input;
            }
            
            // Apply animation using CSS transitions
            const duration = animProps.duration || '0.3s';
            const timing = animProps.timing || 'ease';
            
            element.style.transition = `all ${duration} ${timing}`;
            
            // Apply target styles
            if (animProps.styles) {
                Object.assign(element.style, animProps.styles);
            }
            
            if (context.engine.debugMode) {
                console.log(`🎬 Animated ${selector}:`, animProps);
            }
            
            return {
                animated: true,
                selector: selector,
                duration: duration,
                timing: timing,
                input: input
            };
            
        } catch (error) {
            console.error(`❌ UI animation failed for ${selector}:`, error.message);
            return input;
        }
    },
    
    /**
     * Create virtual list for large datasets
     * @param {Array} input - Data array
     * @param {Array} args - [containerSelector, itemRenderer] Container and renderer
     * @param {Object} context - Execution context
     * @returns {Array} Original data
     */
    'ui_virtual_list': (input, args, context) => {
        const containerSelector = args[0];
        const itemRenderer = args[1] || '{{value}}';
        
        if (!Array.isArray(input)) {
            return input;
        }
        
        if (typeof document === 'undefined') {
            console.log(`[UI_VIRTUAL_LIST] ${containerSelector}: ${input.length} items`);
            return input;
        }
        
        try {
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.warn(`⚠️ Container not found: ${containerSelector}`);
                return input;
            }
            
            // Simple implementation - in real app, this would use virtualization
            const visibleItems = input.slice(0, 50); // Show first 50 items
            
            const itemsHTML = visibleItems.map((item, index) => {
                let content = itemRenderer;
                if (typeof item === 'object' && item !== null) {
                    Object.entries(item).forEach(([key, value]) => {
                        content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
                    });
                } else {
                    content = content.replace(/{{value}}/g, String(item));
                }
                return `<div class="virtual-item" data-index="${index}">${content}</div>`;
            }).join('');
            
            container.innerHTML = itemsHTML;
            
            if (context.engine.debugMode) {
                console.log(`📜 Virtual list ${containerSelector}: ${visibleItems.length}/${input.length} items`);
            }
            
        } catch (error) {
            console.error(`❌ UI virtual list failed for ${containerSelector}:`, error.message);
        }
        
        return input;
    }
};
