// FILENAME: src/runtime/memory/gc.js
// Fluxus Garbage Collector - Production Grade

export class FluxusGarbageCollector {
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled !== false,
            collectionThreshold: config.collectionThreshold || 1000,
            maxHeapSize: config.maxHeapSize || 100 * 1024 * 1024, // 100MB
            collectionInterval: config.collectionInterval || 30000, // 30 seconds
            ...config
        };

        this.heap = new Map();
        this.references = new Map();
        this.allocatedSize = 0;
        this.allocationCount = 0;
        this.collectionStats = {
            totalCollections: 0,
            totalFreed: 0,
            totalTime: 0
        };

        this.roots = new Set(); // GC roots (always reachable)

        if (this.config.enabled) {
            this.startAutomaticCollection();
        }
    }

    // Memory allocation with tracking
    allocate(id, value, metadata = {}) {
        if (this.heap.has(id)) {
            throw new Error(`Memory already allocated for: ${id}`);
        }

        const size = this.calculateSize(value);
        
        // Check heap limits
        if (this.allocatedSize + size > this.config.maxHeapSize) {
            this.collect(); // Try to free memory
        }

        // If still over limit, throw error
        if (this.allocatedSize + size > this.config.maxHeapSize) {
            throw new Error(`Heap size exceeded: ${this.allocatedSize + size} > ${this.config.maxHeapSize}`);
        }

        this.heap.set(id, {
            value,
            size,
            metadata: {
                allocatedAt: Date.now(),
                referenceCount: 0,
                ...metadata
            }
        });

        this.allocatedSize += size;
        this.allocationCount++;

        return id;
    }

    // Reference management
    addReference(fromId, toId) {
        if (!this.heap.has(toId)) {
            throw new Error(`Cannot reference non-existent object: ${toId}`);
        }

        if (!this.references.has(fromId)) {
            this.references.set(fromId, new Set());
        }

        this.references.get(fromId).add(toId);
        
        // Update reference count
        const target = this.heap.get(toId);
        target.metadata.referenceCount++;
    }

    removeReference(fromId, toId) {
        if (this.references.has(fromId)) {
            this.references.get(fromId).delete(toId);
            
            const target = this.heap.get(toId);
            if (target) {
                target.metadata.referenceCount = Math.max(0, target.metadata.referenceCount - 1);
            }
        }
    }

    // Garbage collection implementation
    collect() {
        const startTime = Date.now();
        let freedCount = 0;
        let freedSize = 0;

        // Mark phase: mark all reachable objects
        const reachable = new Set();
        
        // Start from roots
        for (const rootId of this.roots) {
            this.markReachable(rootId, reachable);
        }

        // Sweep phase: remove unreachable objects
        for (const [id, object] of this.heap) {
            if (!reachable.has(id)) {
                freedSize += object.size;
                freedCount++;
                this.heap.delete(id);
            }
        }

        this.allocatedSize -= freedSize;

        // Update statistics
        const duration = Date.now() - startTime;
        this.collectionStats.totalCollections++;
        this.collectionStats.totalFreed += freedSize;
        this.collectionStats.totalTime += duration;

        return {
            freedCount,
            freedSize,
            duration,
            heapSize: this.allocatedSize,
            objectCount: this.heap.size
        };
    }

    markReachable(id, reachable) {
        if (reachable.has(id)) return;
        
        reachable.add(id);
        
        // Recursively mark references
        if (this.references.has(id)) {
            for (const refId of this.references.get(id)) {
                this.markReachable(refId, reachable);
            }
        }
    }

    // Root management
    addRoot(id) {
        if (!this.heap.has(id)) {
            throw new Error(`Cannot add non-existent object as root: ${id}`);
        }
        this.roots.add(id);
    }

    removeRoot(id) {
        this.roots.delete(id);
    }

    // Memory inspection and diagnostics
    getHeapSnapshot() {
        const snapshot = {
            timestamp: Date.now(),
            totalSize: this.allocatedSize,
            objectCount: this.heap.size,
            roots: Array.from(this.roots),
            objects: {}
        };

        for (const [id, object] of this.heap) {
            snapshot.objects[id] = {
                size: object.size,
                type: this.getObjectType(object.value),
                referenceCount: object.metadata.referenceCount,
                allocatedAt: object.metadata.allocatedAt,
                metadata: object.metadata
            };
        }

        return snapshot;
    }

    getObjectType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    calculateSize(value) {
        // Rough size estimation
        if (typeof value === 'string') {
            return value.length * 2; // 2 bytes per character
        }
        if (typeof value === 'number') {
            return 8; // 8 bytes for double
        }
        if (typeof value === 'boolean') {
            return 4;
        }
        if (Array.isArray(value)) {
            return value.reduce((size, item) => size + this.calculateSize(item), 0) + 16;
        }
        if (typeof value === 'object' && value !== null) {
            return Object.values(value).reduce((size, item) => size + this.calculateSize(item), 0) + 32;
        }
        return 8; // Default size
    }

    // Automatic collection management
    startAutomaticCollection() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
        }

        this.collectionInterval = setInterval(() => {
            const stats = this.collect();
            
            if (stats.freedCount > 0) {
                console.log(`🧹 GC collected ${stats.freedCount} objects, freed ${stats.freedSize} bytes`);
            }
        }, this.config.collectionInterval);
    }

    stopAutomaticCollection() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
    }

    // Memory pressure monitoring
    getMemoryPressure() {
        const usage = this.allocatedSize / this.config.maxHeapSize;
        
        if (usage > 0.9) return 'critical';
        if (usage > 0.7) return 'high';
        if (usage > 0.5) return 'medium';
        return 'low';
    }

    // Statistics and reporting
    getStatistics() {
        return {
            ...this.collectionStats,
            currentHeapSize: this.allocatedSize,
            currentObjectCount: this.heap.size,
            memoryPressure: this.getMemoryPressure(),
            averageCollectionTime: this.collectionStats.totalCollections > 0 
                ? this.collectionStats.totalTime / this.collectionStats.totalCollections 
                : 0
        };
    }

    // Cleanup
    dispose() {
        this.stopAutomaticCollection();
        this.heap.clear();
        this.references.clear();
        this.roots.clear();
    }
}

// Singleton instance for global memory management
export const GC = new FluxusGarbageCollector();

export default FluxusGarbageCollector;
