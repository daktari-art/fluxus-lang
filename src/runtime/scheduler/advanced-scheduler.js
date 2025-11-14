// FILENAME: src/runtime/scheduler/advanced-scheduler.js
// Advanced Scheduler for Fluxus Runtime - Production Grade

export class AdvancedScheduler {
    constructor(config = {}) {
        this.config = {
            maxConcurrent: config.maxConcurrent || 10,
            defaultPriority: config.defaultPriority || 'normal',
            enableWorkStealing: config.enableWorkStealing !== false,
            timeSlice: config.timeSlice || 50, // ms per task
            ...config
        };

        this.queues = {
            immediate: [],
            high: [],
            normal: [],
            low: [],
            background: []
        };

        this.running = new Map();
        this.paused = false;
        this.stats = {
            tasksCompleted: 0,
            tasksFailed: 0,
            totalTime: 0,
            queueSizes: {}
        };

        this.workerPool = this.config.enableWorkStealing ? this.createWorkerPool() : null;
        this.updateStats();
    }

    // Task scheduling with priorities
    schedule(task, priority = this.config.defaultPriority, options = {}) {
        const taskId = this.generateTaskId();
        const scheduledTask = {
            id: taskId,
            task,
            priority,
            status: 'pending',
            scheduledAt: Date.now(),
            ...options
        };

        this.queues[priority].push(scheduledTask);
        this.updateStats();

        // Auto-start processing if not already running
        if (!this.paused && this.running.size < this.config.maxConcurrent) {
            this.processNext();
        }

        return taskId;
    }

    // Immediate execution (highest priority)
    scheduleImmediate(task, options = {}) {
        return this.schedule(task, 'immediate', { ...options, immediate: true });
    }

    // Stream processing tasks
    scheduleStreamUpdate(stream, value, options = {}) {
        const task = () => this.processStreamUpdate(stream, value);
        return this.schedule(task, 'high', {
            ...options,
            type: 'stream_update',
            streamId: stream.id
        });
    }

    processStreamUpdate(stream, value) {
        try {
            // Update stream with new value
            if (stream.values.length >= stream.options.bufferSize) {
                if (stream.options.backpressure) {
                    this.handleBackpressure(stream);
                    return;
                } else {
                    stream.values.shift();
                }
            }

            stream.values.push(value);
            stream.metadata.elementCount++;

            // Notify subscribers
            this.notifyStreamSubscribers(stream, value);

            return { success: true, streamId: stream.id, value };
        } catch (error) {
            return { success: false, error: error.message, streamId: stream.id };
        }
    }

    notifyStreamSubscribers(stream, value) {
        stream.metadata.subscribers.forEach(subscriberId => {
            this.schedule(() => {
                const subscriber = this.getStream(subscriberId);
                if (subscriber && subscriber.state === 'ACTIVE') {
                    // Process subscriber update
                    this.processSubscriberUpdate(subscriber, value);
                }
            }, 'normal', { type: 'stream_notification', subscriberId });
        });
    }

    // Task processing
    async processNext() {
        if (this.paused || this.running.size >= this.config.maxConcurrent) {
            return;
        }

        const task = this.getNextTask();
        if (!task) {
            return; // No tasks to process
        }

        task.status = 'running';
        task.startedAt = Date.now();
        this.running.set(task.id, task);

        try {
            const result = await this.executeTask(task);
            
            task.status = 'completed';
            task.completedAt = Date.now();
            task.duration = task.completedAt - task.startedAt;
            
            this.stats.tasksCompleted++;
            this.stats.totalTime += task.duration;

            // Notify completion
            if (task.onComplete) {
                this.schedule(() => task.onComplete(result), 'immediate');
            }

        } catch (error) {
            task.status = 'failed';
            task.error = error;
            task.completedAt = Date.now();
            
            this.stats.tasksFailed++;

            // Notify error
            if (task.onError) {
                this.schedule(() => task.onError(error), 'immediate');
            }
        } finally {
            this.running.delete(task.id);
            this.updateStats();

            // Process next task
            setImmediate(() => this.processNext());
        }
    }

    getNextTask() {
        // Priority-based task selection
        const priorities = ['immediate', 'high', 'normal', 'low', 'background'];
        
        for (const priority of priorities) {
            if (this.queues[priority].length > 0) {
                return this.queues[priority].shift();
            }
        }
        
        return null;
    }

    async executeTask(task) {
        const { task: taskFn, timeSlice = this.config.timeSlice } = task;

        if (typeof taskFn !== 'function') {
            throw new Error('Task must be a function');
        }

        // Execute with optional time slicing
        if (timeSlice > 0) {
            return this.executeWithTimeSlice(taskFn, timeSlice);
        }

        // Direct execution
        return taskFn();
    }

    executeWithTimeSlice(taskFn, timeSlice) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const executeChunk = () => {
                try {
                    const result = taskFn();
                    
                    if (result instanceof Promise) {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            // Simple time slicing - in real implementation, this would be more sophisticated
            if (Date.now() - startTime < timeSlice) {
                executeChunk();
            } else {
                // Reschedule remaining work
                this.schedule(taskFn, task.priority, {
                    timeSlice: timeSlice / 2,
                    originalTask: task.id
                });
                resolve({ status: 'yielded', rescheduled: true });
            }
        });
    }

    // Task management
    cancelTask(taskId) {
        // Remove from queues
        for (const [priority, queue] of Object.entries(this.queues)) {
            const index = queue.findIndex(task => task.id === taskId);
            if (index !== -1) {
                queue.splice(index, 1);
                this.updateStats();
                return true;
            }
        }

        // Cannot cancel running tasks
        if (this.running.has(taskId)) {
            console.warn(`Cannot cancel running task: ${taskId}`);
            return false;
        }

        return false;
    }

    getTaskStatus(taskId) {
        // Check running tasks
        if (this.running.has(taskId)) {
            return this.running.get(taskId);
        }

        // Check queues
        for (const [priority, queue] of Object.entries(this.queues)) {
            const task = queue.find(t => t.id === taskId);
            if (task) {
                return task;
            }
        }

        return null;
    }

    // Queue management
    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
        this.processNext();
    }

    clearQueue(priority = null) {
        if (priority) {
            this.queues[priority] = [];
        } else {
            for (const queueName of Object.keys(this.queues)) {
                this.queues[queueName] = [];
            }
        }
        this.updateStats();
    }

    // Statistics and monitoring
    updateStats() {
        this.stats.queueSizes = {};
        for (const [priority, queue] of Object.entries(this.queues)) {
            this.stats.queueSizes[priority] = queue.length;
        }
        this.stats.runningCount = this.running.size;
    }

    getStatistics() {
        return {
            ...this.stats,
            paused: this.paused,
            maxConcurrent: this.config.maxConcurrent,
            workerPool: this.workerPool ? 'active' : 'inactive'
        };
    }

    // Worker pool for work stealing
    createWorkerPool() {
        // Simplified worker pool implementation
        // In real implementation, this would use Worker threads
        return {
            workers: [],
            stealWork: () => {
                // Find work from other queues
                for (const [priority, queue] of Object.entries(this.queues)) {
                    if (queue.length > 0 && priority !== 'immediate') {
                        return queue.shift();
                    }
                }
                return null;
            }
        };
    }

    // Utility methods
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getStream(streamId) {
        // This would integrate with the stream registry
        // For now, return a mock
        return null;
    }

    processSubscriberUpdate(subscriber, value) {
        // Process subscriber-specific update logic
        console.log(`Updating subscriber ${subscriber.id} with value:`, value);
    }

    handleBackpressure(stream) {
        // Implement backpressure strategies
        console.warn(`Backpressure detected for stream: ${stream.id}`);
    }

    // Cleanup
    dispose() {
        this.pause();
        this.clearQueue();
        this.running.clear();
        
        if (this.workerPool) {
            this.workerPool.workers = [];
        }
    }
}

export default AdvancedScheduler;
