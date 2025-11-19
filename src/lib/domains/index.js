1// FILENAME: src/lib/domains/index.js
// Domain Library Registry - Production Grade with Fallback Support

import { HEALTH_OPERATORS } from './health.js';
import { IOT_OPERATORS } from './iot.js';
import { ANALYTICS_OPERATORS, registerWithEngine as registerAnalytics } from './analytics.js';
import { FLUXUS_SENSOR_OPERATORS } from './sensors.js';
import { UI_OPERATORS } from './ui.js';

// Fallback registration functions for domains that don't have them
const createFallbackRegistration = (domainName, operators) => {
    return (engine) => {
        console.log(`🔄 Registering ${domainName} Domain (fallback)...`);
        
        let count = 0;
        for (const [operatorName, operatorDef] of Object.entries(operators)) {
            if (!engine.operators.has(operatorName)) {
                const implementation = operatorDef.implementation || operatorDef;
                
                const wrappedOperator = async (input, args, context) => {
                    const startTime = Date.now();
                    
                    try {
                        const result = await implementation(input, args, {
                            ...context,
                            domain: domainName,
                            operator: operatorName
                        });
                        
                        const executionTime = Date.now() - startTime;
                        if (context.orchestrator) {
                            context.orchestrator.emit('operator:executed', {
                                domain: domainName,
                                operator: operatorName,
                                executionTime,
                                success: true
                            });
                        }
                        
                        return result;
                        
                    } catch (error) {
                        const executionTime = Date.now() - startTime;
                        if (context.orchestrator) {
                            context.orchestrator.emit('operator:failed', {
                                domain: domainName,
                                operator: operatorName,
                                executionTime,
                                error: error.message,
                                success: false
                            });
                        }
                        
                        throw new Error(`[${domainName}.${operatorName}] ${error.message}`);
                    }
                };
                
                engine.operators.set(operatorName, wrappedOperator);
                count++;
            }
        }
        
        console.log(`   ✅ ${domainName} Domain registered: ${count} operators`);
        return count;
    };
};

// Try to import with registration functions, fallback to creating them
let registerHealth, registerIoT, registerSensors, registerUI;

try {
    // Try to import the actual registration functions
    const healthModule = await import('./health.js');
    registerHealth = healthModule.registerWithEngine || createFallbackRegistration('health', HEALTH_OPERATORS);
} catch {
    registerHealth = createFallbackRegistration('health', HEALTH_OPERATORS);
}

try {
    const iotModule = await import('./iot.js');
    registerIoT = iotModule.registerWithEngine || createFallbackRegistration('iot', IOT_OPERATORS);
} catch {
    registerIoT = createFallbackRegistration('iot', IOT_OPERATORS);
}

try {
    const sensorsModule = await import('./sensors.js');
    registerSensors = sensorsModule.registerWithEngine || createFallbackRegistration('sensors', FLUXUS_SENSOR_OPERATORS);
} catch {
    registerSensors = createFallbackRegistration('sensors', FLUXUS_SENSOR_OPERATORS);
}

try {
    const uiModule = await import('./ui.js');
    registerUI = uiModule.registerWithEngine || createFallbackRegistration('ui', UI_OPERATORS);
} catch {
    registerUI = createFallbackRegistration('ui', UI_OPERATORS);
}

// Unified Domain Registry
export const DOMAIN_REGISTRY = {
    health: {
        operators: HEALTH_OPERATORS,
        register: registerHealth,
        description: 'Health and fitness tracking operations',
        version: '1.0.0',
        type: 'domain'
    },
    iot: {
        operators: IOT_OPERATORS,
        register: registerIoT,
        description: 'Internet of Things device management',
        version: '1.0.0',
        type: 'domain'
    },
    analytics: {
        operators: ANALYTICS_OPERATORS,
        register: registerAnalytics,
        description: 'Data analytics and processing operations',
        version: '1.0.0',
        type: 'domain'
    },
    sensors: {
        operators: FLUXUS_SENSOR_OPERATORS,
        register: registerSensors,
        description: 'Sensor data collection and processing',
        version: '1.0.0',
        type: 'domain'
    },
    ui: {
        operators: UI_OPERATORS,
        register: registerUI,
        description: 'User interface and interaction operations',
        version: '1.0.0',
        type: 'domain'
    }
};

// Domain Manager Class
export class DomainManager {
    constructor(engine) {
        this.engine = engine;
        this.loadedDomains = new Map();
        this.operatorCount = 0;
    }

    async loadDomain(domainName) {
        if (this.loadedDomains.has(domainName)) {
            return this.loadedDomains.get(domainName).operatorCount;
        }

        const domain = DOMAIN_REGISTRY[domainName];
        if (!domain) {
            throw new Error(`Unknown domain: ${domainName}`);
        }

        try {
            const operatorCount = await domain.register(this.engine);
            
            this.loadedDomains.set(domainName, {
                operators: operatorCount,
                loadedAt: Date.now(),
                operatorsList: Object.keys(domain.operators),
                domainInfo: domain
            });

            this.operatorCount += operatorCount;
            
            console.log(`✅ Domain loaded: ${domainName} (${operatorCount} operators)`);
            return operatorCount;
        } catch (error) {
            console.error(`❌ Failed to load domain ${domainName}:`, error.message);
            throw error;
        }
    }

    async loadAllDomains() {
        const results = {};
        
        for (const [domainName] of Object.entries(DOMAIN_REGISTRY)) {
            try {
                results[domainName] = await this.loadDomain(domainName);
            } catch (error) {
                console.error(`❌ Failed to load domain ${domainName}:`, error.message);
                results[domainName] = 0;
            }
        }
        
        console.log(`🎯 All domains loaded: ${this.operatorCount} total operators`);
        return results;
    }

    getDomainOperator(domainName, operatorName) {
        const domain = DOMAIN_REGISTRY[domainName];
        if (!domain) return null;
        
        return domain.operators[operatorName];
    }

    executeDomainOperator(domainName, operatorName, input, args = [], context = {}) {
        const operator = this.getDomainOperator(domainName, operatorName);
        if (!operator) {
            throw new Error(`Operator ${operatorName} not found in domain ${domainName}`);
        }

        const operatorImpl = operator.implementation || operator;
        
        return operatorImpl(input, args, {
            ...context,
            domain: domainName,
            operator: operatorName
        });
    }

    getLoadedDomains() {
        return Array.from(this.loadedDomains.keys());
    }

    getDomainInfo(domainName) {
        const domain = DOMAIN_REGISTRY[domainName];
        if (!domain) return null;

        const loadedInfo = this.loadedDomains.get(domainName);
        
        return {
            name: domainName,
            description: domain.description,
            version: domain.version,
            type: domain.type,
            operators: Object.keys(domain.operators),
            isLoaded: !!loadedInfo,
            loadedAt: loadedInfo?.loadedAt,
            operatorCount: loadedInfo?.operators || 0
        };
    }

    getDomainStats() {
        const stats = {
            totalDomains: Object.keys(DOMAIN_REGISTRY).length,
            loadedDomains: this.loadedDomains.size,
            totalOperators: this.operatorCount,
            domains: {}
        };

        for (const [domainName, domain] of Object.entries(DOMAIN_REGISTRY)) {
            const loadedInfo = this.loadedDomains.get(domainName);
            stats.domains[domainName] = {
                operators: Object.keys(domain.operators).length,
                loaded: !!loadedInfo,
                operatorCount: loadedInfo?.operators || 0
            };
        }

        return stats;
    }
}

// Export individual domains for direct access
export { HEALTH_OPERATORS, IOT_OPERATORS, ANALYTICS_OPERATORS, FLUXUS_SENSOR_OPERATORS, UI_OPERATORS };
export { registerHealth, registerIoT, registerAnalytics, registerSensors, registerUI };

export default DOMAIN_REGISTRY;
