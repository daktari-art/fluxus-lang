// FILENAME: src/lib/library-conflict-resolver.js
// Fluxus Enterprise Library Conflict Resolver v4.0

import { securityManager } from './security-manager.js';

/**
 * ENTERPRISE LIBRARY CONFLICT RESOLVER
 * 
 * Features:
 * - Version conflict detection and resolution
 * - Dependency graph analysis
 * - Semantic versioning compliance
 * - Circular dependency prevention
 * - Compatibility verification
 */

export class LibraryConflictResolver {
    constructor() {
        this.dependencyGraph = new Map();
        this.versionRegistry = new Map();
        this.compatibilityMatrix = new Map();
        this.resolutionStrategies = new Map();
        
        this.initializeResolutionStrategies();
    }

    /**
     * Initialize conflict resolution strategies
     */
    initializeResolutionStrategies() {
        this.resolutionStrategies.set('highest_version', {
            name: 'Highest Version',
            description: 'Select the highest compatible version',
            resolver: (conflicts) => this.resolveHighestVersion(conflicts)
        });

        this.resolutionStrategies.set('most_stable', {
            name: 'Most Stable',
            description: 'Select the most stable version',
            resolver: (conflicts) => this.resolveMostStable(conflicts)
        });

        this.resolutionStrategies.set('least_dependencies', {
            name: 'Least Dependencies',
            description: 'Select version with fewest dependencies',
            resolver: (conflicts) => this.resolveLeastDependencies(conflicts)
        });

        this.resolutionStrategies.set('security_priority', {
            name: 'Security Priority',
            description: 'Select version with best security track record',
            resolver: (conflicts) => this.resolveSecurityPriority(conflicts)
        });
    }

    /**
     * Register a library with its dependencies
     */
    registerLibrary(libraryName, version, dependencies = {}) {
        const libraryKey = `${libraryName}@${version}`;
        
        this.versionRegistry.set(libraryKey, {
            name: libraryName,
            version: version,
            dependencies: dependencies,
            timestamp: Date.now()
        });

        // Update dependency graph
        this.dependencyGraph.set(libraryKey, new Set());
        
        for (const [depName, depVersion] of Object.entries(dependencies)) {
            const depKey = `${depName}@${depVersion}`;
            this.dependencyGraph.get(libraryKey).add(depKey);
        }

        return this.validateDependencies(libraryKey);
    }

    /**
     * Resolve library conflicts for a given set of requirements
     */
    async resolveConflicts(requirements, strategy = 'highest_version') {
        const conflicts = this.detectConflicts(requirements);
        
        if (conflicts.length === 0) {
            return { resolved: true, selections: this.calculateSelections(requirements) };
        }

        const resolver = this.resolutionStrategies.get(strategy)?.resolver;
        if (!resolver) {
            throw new Error(`Unknown resolution strategy: ${strategy}`);
        }

        const resolution = await resolver(conflicts);
        
        // Verify resolution doesn't introduce new conflicts
        const verified = await this.verifyResolution(resolution, requirements);
        
        if (!verified.valid) {
            // Try fallback strategies
            return await this.tryFallbackStrategies(conflicts, requirements, strategy);
        }

        return {
            resolved: true,
            selections: resolution.selections,
            conflictsResolved: conflicts.length,
            strategy: strategy
        };
    }

    /**
     * Detect version conflicts in requirements
     */
    detectConflicts(requirements) {
        const conflicts = [];
        const versionRanges = new Map();

        // Collect version requirements for each library
        for (const [libName, versionReq] of Object.entries(requirements)) {
            if (!versionRanges.has(libName)) {
                versionRanges.set(libName, []);
            }
            versionRanges.get(libName).push(versionReq);
        }

        // Check for conflicts within each library
        for (const [libName, ranges] of versionRanges) {
            if (ranges.length > 1) {
                const compatible = this.checkVersionCompatibility(ranges);
                if (!compatible) {
                    conflicts.push({
                        library: libName,
                        requirements: ranges,
                        type: 'version_conflict'
                    });
                }
            }
        }

        // Check for dependency conflicts
        const dependencyConflicts = this.detectDependencyConflicts(requirements);
        conflicts.push(...dependencyConflicts);

        return conflicts;
    }

    /**
     * Detect conflicts in dependency graph
     */
    detectDependencyConflicts(requirements) {
        const conflicts = [];
        const visited = new Set();
        const dependencyTree = this.buildDependencyTree(requirements);

        for (const [libKey, deps] of dependencyTree) {
            for (const depKey of deps) {
                if (visited.has(depKey)) continue;
                
                const [depName, depVersion] = depKey.split('@');
                const conflictingDeps = this.findConflictingDependencies(depName, dependencyTree);
                
                if (conflictingDeps.length > 0) {
                    conflicts.push({
                        library: depName,
                        requirements: conflictingDeps,
                        type: 'dependency_conflict'
                    });
                }
                
                visited.add(depKey);
            }
        }

        return conflicts;
    }

    /**
     * Build complete dependency tree for requirements
     */
    buildDependencyTree(requirements) {
        const tree = new Map();
        const queue = Object.entries(requirements).map(([name, version]) => `${name}@${version}`);

        while (queue.length > 0) {
            const libKey = queue.shift();
            if (tree.has(libKey)) continue;

            const library = this.versionRegistry.get(libKey);
            if (!library) continue;

            tree.set(libKey, new Set());
            
            for (const [depName, depVersion] of Object.entries(library.dependencies)) {
                const depKey = `${depName}@${depVersion}`;
                tree.get(libKey).add(depKey);
                
                if (!tree.has(depKey)) {
                    queue.push(depKey);
                }
            }
        }

        return tree;
    }

    /**
     * Find conflicting dependencies for a library
     */
    findConflictingDependencies(libraryName, dependencyTree) {
        const versions = new Set();
        
        for (const [libKey, deps] of dependencyTree) {
            for (const depKey of deps) {
                if (depKey.startsWith(`${libraryName}@`)) {
                    versions.add(depKey);
                }
            }
        }

        const versionArray = Array.from(versions);
        if (versionArray.length <= 1) return [];

        // Check if all versions are compatible
        const compatible = this.checkVersionCompatibility(versionArray.map(v => v.split('@')[1]));
        return compatible ? [] : versionArray;
    }

    /**
     * Check if multiple version requirements are compatible
     */
    checkVersionCompatibility(versionRanges) {
        if (versionRanges.length <= 1) return true;

        // Parse all version ranges
        const ranges = versionRanges.map(range => this.parseVersionRange(range));
        
        // Find intersection of all ranges
        let intersection = ranges[0];
        
        for (let i = 1; i < ranges.length; i++) {
            intersection = this.intersectRanges(intersection, ranges[i]);
            if (!intersection) return false;
        }

        return intersection !== null;
    }

    /**
     * Parse semantic version range
     */
    parseVersionRange(range) {
        // Simple implementation - in production would use proper semver parsing
        if (range === '*' || range === 'latest') {
            return { min: '0.0.0', max: '999.999.999' };
        }

        if (range.startsWith('^')) {
            const version = range.slice(1);
            const [major] = version.split('.');
            return {
                min: version,
                max: `${parseInt(major) + 1}.0.0`
            };
        }

        if (range.startsWith('~')) {
            const version = range.slice(1);
            const [major, minor] = version.split('.');
            return {
                min: version,
                max: `${major}.${parseInt(minor) + 1}.0`
            };
        }

        // Exact version
        return { min: range, max: range };
    }

    /**
     * Intersect two version ranges
     */
    intersectRanges(range1, range2) {
        const maxMin = this.compareVersions(range1.min, range2.min) > 0 ? range1.min : range2.min;
        const minMax = this.compareVersions(range1.max, range2.max) < 0 ? range1.max : range2.max;

        if (this.compareVersions(maxMin, minMax) > 0) {
            return null; // No intersection
        }

        return { min: maxMin, max: minMax };
    }

    /**
     * Compare two semantic versions
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }

        return 0;
    }

    /**
     * Resolution strategy implementations
     */
    resolveHighestVersion(conflicts) {
        const selections = new Map();

        for (const conflict of conflicts) {
            if (conflict.type === 'version_conflict') {
                const highestVersion = this.findHighestVersion(conflict.requirements);
                selections.set(conflict.library, highestVersion);
            }
        }

        return { selections: Object.fromEntries(selections) };
    }

    resolveMostStable(conflicts) {
        const selections = new Map();

        for (const conflict of conflicts) {
            if (conflict.type === 'version_conflict') {
                const mostStable = this.findMostStableVersion(conflict.requirements);
                selections.set(conflict.library, mostStable);
            }
        }

        return { selections: Object.fromEntries(selections) };
    }

    resolveLeastDependencies(conflicts) {
        const selections = new Map();

        for (const conflict of conflicts) {
            if (conflict.type === 'version_conflict') {
                const leastDeps = this.findVersionWithLeastDependencies(conflict.requirements);
                selections.set(conflict.library, leastDeps);
            }
        }

        return { selections: Object.fromEntries(selections) };
    }

    async resolveSecurityPriority(conflicts) {
        const selections = new Map();

        for (const conflict of conflicts) {
            if (conflict.type === 'version_conflict') {
                const secureVersion = await this.findMostSecureVersion(conflict.library, conflict.requirements);
                selections.set(conflict.library, secureVersion);
            }
        }

        return { selections: Object.fromEntries(selections) };
    }

    /**
     * Helper methods for resolution strategies
     */
    findHighestVersion(requirements) {
        let highest = '0.0.0';
        
        for (const req of requirements) {
            const version = this.extractVersionFromRange(req);
            if (this.compareVersions(version, highest) > 0) {
                highest = version;
            }
        }
        
        return highest;
    }

    findMostStableVersion(requirements) {
        // Prefer versions without pre-release tags
        const stableVersions = requirements.filter(req => !req.includes('-'));
        
        if (stableVersions.length > 0) {
            return this.findHighestVersion(stableVersions);
        }
        
        return this.findHighestVersion(requirements);
    }

    findVersionWithLeastDependencies(requirements) {
        let bestVersion = null;
        let minDependencies = Infinity;

        for (const req of requirements) {
            const version = this.extractVersionFromRange(req);
            const libKey = `${this.extractLibraryName(req)}@${version}`;
            const library = this.versionRegistry.get(libKey);

            if (library && Object.keys(library.dependencies).length < minDependencies) {
                minDependencies = Object.keys(library.dependencies).length;
                bestVersion = version;
            }
        }

        return bestVersion || this.findHighestVersion(requirements);
    }

    async findMostSecureVersion(libraryName, requirements) {
        // In production, this would check security databases
        // For now, use the highest version as a proxy for security
        return this.findHighestVersion(requirements);
    }

    /**
     * Utility methods
     */
    extractVersionFromRange(range) {
        // Extract base version from range specification
        if (range.startsWith('^') || range.startsWith('~')) {
            return range.slice(1);
        }
        return range;
    }

    extractLibraryName(range) {
        // This would normally extract from full requirement spec
        // Simplified implementation
        return range.split('@')[0];
    }

    calculateSelections(requirements) {
        const selections = { ...requirements };
        
        // Add default versions for any libraries without explicit requirements
        for (const [libKey] of this.versionRegistry) {
            const [libName] = libKey.split('@');
            if (!selections[libName]) {
                const latest = this.findLatestVersion(libName);
                if (latest) {
                    selections[libName] = latest;
                }
            }
        }
        
        return selections;
    }

    findLatestVersion(libraryName) {
        let latest = null;
        
        for (const [libKey] of this.versionRegistry) {
            if (libKey.startsWith(`${libraryName}@`)) {
                const version = libKey.split('@')[1];
                if (!latest || this.compareVersions(version, latest) > 0) {
                    latest = version;
                }
            }
        }
        
        return latest;
    }

    async verifyResolution(resolution, originalRequirements) {
        const combinedRequirements = { ...originalRequirements, ...resolution.selections };
        const newConflicts = this.detectConflicts(combinedRequirements);
        
        return {
            valid: newConflicts.length === 0,
            remainingConflicts: newConflicts
        };
    }

    async tryFallbackStrategies(conflicts, requirements, originalStrategy) {
        const strategies = Array.from(this.resolutionStrategies.keys())
            .filter(s => s !== originalStrategy);

        for (const strategy of strategies) {
            try {
                const resolver = this.resolutionStrategies.get(strategy)?.resolver;
                const resolution = await resolver(conflicts);
                const verified = await this.verifyResolution(resolution, requirements);
                
                if (verified.valid) {
                    return {
                        resolved: true,
                        selections: resolution.selections,
                        conflictsResolved: conflicts.length,
                        strategy: strategy,
                        fallback: true
                    };
                }
            } catch (error) {
                // Try next strategy
                continue;
            }
        }

        return {
            resolved: false,
            error: 'Could not resolve conflicts with any strategy',
            conflicts: conflicts
        };
    }

    validateDependencies(libraryKey) {
        const library = this.versionRegistry.get(libraryKey);
        if (!library) return { valid: false, error: 'Library not found' };

        const issues = [];

        // Check for circular dependencies
        if (this.hasCircularDependency(libraryKey)) {
            issues.push('Circular dependency detected');
        }

        // Check for missing dependencies
        for (const [depName, depVersion] of Object.entries(library.dependencies)) {
            const depKey = `${depName}@${depVersion}`;
            if (!this.versionRegistry.has(depKey)) {
                issues.push(`Missing dependency: ${depKey}`);
            }
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    hasCircularDependency(startKey, visited = new Set(), path = new Set()) {
        if (path.has(startKey)) return true;
        if (visited.has(startKey)) return false;

        visited.add(startKey);
        path.add(startKey);

        const library = this.versionRegistry.get(startKey);
        if (library) {
            for (const [depName, depVersion] of Object.entries(library.dependencies)) {
                const depKey = `${depName}@${depVersion}`;
                if (this.hasCircularDependency(depKey, visited, path)) {
                    return true;
                }
            }
        }

        path.delete(startKey);
        return false;
    }

    /**
     * Get dependency graph visualization
     */
    getDependencyGraph() {
        const graph = {};
        
        for (const [libKey, deps] of this.dependencyGraph) {
            graph[libKey] = Array.from(deps);
        }
        
        return graph;
    }

    /**
     * Clean up old versions
     */
    cleanupOldVersions(keepCount = 3) {
        const libraries = new Map();
        
        // Group versions by library name
        for (const [libKey] of this.versionRegistry) {
            const [libName, version] = libKey.split('@');
            if (!libraries.has(libName)) {
                libraries.set(libName, []);
            }
            libraries.get(libName).push({ key: libKey, version });
        }
        
        // Remove old versions
        let removed = 0;
        for (const [libName, versions] of libraries) {
            if (versions.length > keepCount) {
                // Sort by version (newest first)
                versions.sort((a, b) => this.compareVersions(b.version, a.version));
                
                // Remove old versions
                const toRemove = versions.slice(keepCount);
                for (const version of toRemove) {
                    this.versionRegistry.delete(version.key);
                    this.dependencyGraph.delete(version.key);
                    removed++;
                }
            }
        }
        
        return removed;
    }
}

export const resolveLibraryConflict = async (dependencyName, conflict, options = {}) => {
    const resolver = new LibraryConflictResolver(options.strategy);
    return await resolver.resolveConflict(dependencyName, conflict, options);
};

// Export default instance
export const conflictResolver = new LibraryConflictResolver();
