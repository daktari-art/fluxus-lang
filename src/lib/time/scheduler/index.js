// FILENAME: src/lib/time/scheduler/index.js
// Time Scheduler Utilities - Production Grade

export class TimeScheduler {
    constructor(config = {}) {
        this.config = {
            precision: config.precision || 100, // ms
            maxScheduled: config.maxScheduled || 1000,
            enableRecovery: config.enableRecovery !== false,
            ...config
        };

        this.scheduledTasks = new Map();
        this.intervalTasks = new Map();
        this.timeoutTasks = new Map();
        this.cronJobs = new Map();
        
        this.isRunning = false;
        this.lastTick = Date.now();
        this.tickCount = 0;
        
        this.metrics = {
            tasksExecuted: 0,
            tasksFailed: 0,
            averageLatency: 0,
            totalUptime: 0
        };
    }

    // One-time scheduling
    schedule(task, delay, options = {}) {
        if (this.scheduledTasks.size >= this.config.maxScheduled) {
            throw new Error('Maximum scheduled tasks reached');
        }

        const taskId = this.generateTaskId();
        const executionTime = Date.now() + delay;

        const scheduledTask = {
            id: taskId,
            task,
            executionTime,
            delay,
            options,
            status: 'scheduled',
            createdAt: Date.now()
        };

        this.scheduledTasks.set(taskId, scheduledTask);

        // Set timeout for execution
        const timeoutId = setTimeout(() => {
            this.executeScheduledTask(taskId);
        }, delay);

        this.timeoutTasks.set(taskId, timeoutId);

        return taskId;
    }

    // Interval scheduling
    setInterval(task, interval, options = {}) {
        const taskId = this.generateTaskId();

        const intervalTask = {
            id: taskId,
            task,
            interval,
            options,
            status: 'active',
            lastExecution: null,
            executionCount: 0,
            createdAt: Date.now()
        };

        this.intervalTasks.set(taskId, intervalTask);

        // Start interval
        const intervalId = setInterval(() => {
            this.executeIntervalTask(taskId);
        }, interval);

        this.intervalTasks.get(taskId).intervalId = intervalId;

        return taskId;
    }

    // Cron-like scheduling
    scheduleCron(task, cronExpression, options = {}) {
        const taskId = this.generateTaskId();
        const schedule = this.parseCronExpression(cronExpression);

        const cronJob = {
            id: taskId,
            task,
            expression: cronExpression,
            schedule,
            options,
            status: 'active',
            lastExecution: null,
            nextExecution: this.calculateNextCronExecution(schedule),
            executionCount: 0,
            createdAt: Date.now()
        };

        this.cronJobs.set(taskId, cronJob);

        return taskId;
    }

    // Task execution
    async executeScheduledTask(taskId) {
        const task = this.scheduledTasks.get(taskId);
        if (!task) return;

        task.status = 'executing';
        task.startedAt = Date.now();

        try {
            const result = await task.task();
            
            task.status = 'completed';
            task.completedAt = Date.now();
            task.result = result;
            
            this.metrics.tasksExecuted++;
            this.updateLatencyMetrics(task);

        } catch (error) {
            task.status = 'failed';
            task.error = error;
            task.completedAt = Date.now();
            
            this.metrics.tasksFailed++;
            
            if (this.config.enableRecovery && task.options.retry) {
                this.handleTaskRetry(task);
            }
        } finally {
            this.cleanupTask(taskId);
        }
    }

    async executeIntervalTask(taskId) {
        const task = this.intervalTasks.get(taskId);
        if (!task || task.status !== 'active') return;

        task.lastExecution = Date.now();

        try {
            await task.task();
            task.executionCount++;
            this.metrics.tasksExecuted++;
        } catch (error) {
            this.metrics.tasksFailed++;
            
            if (task.options.onError) {
                task.options.onError(error);
            }
        }
    }

    executeCronTasks() {
        const now = new Date();
        
        for (const [taskId, job] of this.cronJobs) {
            if (job.status === 'active' && job.nextExecution <= now) {
                this.executeCronTask(taskId);
                job.nextExecution = this.calculateNextCronExecution(job.schedule);
            }
        }
    }

    async executeCronTask(taskId) {
        const job = this.cronJobs.get(taskId);
        if (!job) return;

        job.lastExecution = Date.now();

        try {
            await job.task();
            job.executionCount++;
            this.metrics.tasksExecuted++;
        } catch (error) {
            this.metrics.tasksFailed++;
            
            if (job.options.onError) {
                job.options.onError(error);
            }
        }
    }

    // Task management
    cancelTask(taskId) {
        // Cancel scheduled task
        if (this.scheduledTasks.has(taskId)) {
            const timeoutId = this.timeoutTasks.get(taskId);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            this.scheduledTasks.delete(taskId);
            this.timeoutTasks.delete(taskId);
            return true;
        }

        // Cancel interval task
        if (this.intervalTasks.has(taskId)) {
            const task = this.intervalTasks.get(taskId);
            if (task.intervalId) {
                clearInterval(task.intervalId);
            }
            this.intervalTasks.delete(taskId);
            return true;
        }

        // Cancel cron job
        if (this.cronJobs.has(taskId)) {
            this.cronJobs.get(taskId).status = 'cancelled';
            this.cronJobs.delete(taskId);
            return true;
        }

        return false;
    }

    pauseTask(taskId) {
        const task = this.intervalTasks.get(taskId) || this.cronJobs.get(taskId);
        if (task) {
            task.status = 'paused';
            return true;
        }
        return false;
    }

    resumeTask(taskId) {
        const task = this.intervalTasks.get(taskId) || this.cronJobs.get(taskId);
        if (task && task.status === 'paused') {
            task.status = 'active';
            return true;
        }
        return false;
    }

    getTaskStatus(taskId) {
        if (this.scheduledTasks.has(taskId)) {
            return this.scheduledTasks.get(taskId);
        }
        if (this.intervalTasks.has(taskId)) {
            return this.intervalTasks.get(taskId);
        }
        if (this.cronJobs.has(taskId)) {
            return this.cronJobs.get(taskId);
        }
        return null;
    }

    // Scheduler control
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTick = Date.now();
        this.startTime = Date.now();

        // Start main scheduler loop
        this.schedulerInterval = setInterval(() => {
            this.tick();
        }, this.config.precision);

        console.log('⏰ Time Scheduler started');
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }

        // Calculate total uptime
        this.metrics.totalUptime += Date.now() - this.startTime;

        console.log('⏰ Time Scheduler stopped');
    }

    tick() {
        const now = Date.now();
        this.tickCount++;
        
        // Execute due cron jobs
        this.executeCronTasks();
        
        // Update metrics
        this.updateMetrics(now);
        this.lastTick = now;
    }

    // Utility methods
    parseCronExpression(expression) {
        // Simple cron expression parser
        const parts = expression.split(' ');
        
        if (parts.length !== 5) {
            throw new Error('Invalid cron expression format');
        }

        return {
            minute: this.parseCronField(parts[0], 0, 59),
            hour: this.parseCronField(parts[1], 0, 23),
            dayOfMonth: this.parseCronField(parts[2], 1, 31),
            month: this.parseCronField(parts[3], 1, 12),
            dayOfWeek: this.parseCronField(parts[4], 0, 6)
        };
    }

    parseCronField(field, min, max) {
        if (field === '*') {
            return { type: 'any', values: [] };
        }
        
        if (field.includes(',')) {
            const values = field.split(',').map(v => parseInt(v, 10));
            return { type: 'specific', values };
        }
        
        if (field.includes('-')) {
            const [start, end] = field.split('-').map(v => parseInt(v, 10));
            return { type: 'range', start, end };
        }
        
        if (field.includes('/')) {
            const [range, step] = field.split('/');
            const start = range === '*' ? min : parseInt(range, 10);
            return { type: 'step', start, step: parseInt(step, 10) };
        }
        
        return { type: 'specific', values: [parseInt(field, 10)] };
    }

    calculateNextCronExecution(schedule) {
        const now = new Date();
        let next = new Date(now);
        
        // Find next matching minute
        next.setMinutes(this.findNextValue(schedule.minute, next.getMinutes()));
        if (next.getMinutes() < now.getMinutes()) {
            next.setHours(next.getHours() + 1);
            next.setMinutes(this.findNextValue(schedule.minute, 0));
        }

        // Find next matching hour
        next.setHours(this.findNextValue(schedule.hour, next.getHours()));
        if (next.getHours() < now.getHours()) {
            next.setDate(next.getDate() + 1);
            next.setHours(this.findNextValue(schedule.hour, 0));
        }

        // Find next matching day of month
        next.setDate(this.findNextValue(schedule.dayOfMonth, next.getDate()));
        if (next.getDate() < now.getDate()) {
            next.setMonth(next.getMonth() + 1);
            next.setDate(this.findNextValue(schedule.dayOfMonth, 1));
        }

        // Find next matching month
        next.setMonth(this.findNextValue(schedule.month, next.getMonth() + 1) - 1);
        if (next.getMonth() < now.getMonth()) {
            next.setFullYear(next.getFullYear() + 1);
            next.setMonth(this.findNextValue(schedule.month, 1) - 1);
        }

        return next;
    }

    findNextValue(field, current) {
        switch (field.type) {
            case 'any':
                return current;
            case 'specific':
                return field.values.find(v => v >= current) || field.values[0];
            case 'range':
                if (current >= field.start && current <= field.end) {
                    return current;
                }
                return field.start;
            case 'step':
                const next = Math.ceil(current / field.step) * field.step;
                return next >= field.start ? next : field.start;
            default:
                return current;
        }
    }

    handleTaskRetry(task) {
        const retryConfig = task.options.retry;
        const maxRetries = retryConfig.maxRetries || 3;
        const retryDelay = retryConfig.delay || 1000;

        if (!task.retryCount) {
            task.retryCount = 0;
        }

        if (task.retryCount < maxRetries) {
            task.retryCount++;
            
            // Reschedule the task
            setTimeout(() => {
                this.executeScheduledTask(task.id);
            }, retryDelay);
        }
    }

    cleanupTask(taskId) {
        this.scheduledTasks.delete(taskId);
        this.timeoutTasks.delete(taskId);
    }

    updateLatencyMetrics(task) {
        const latency = task.completedAt - task.executionTime;
        this.metrics.averageLatency = 
            (this.metrics.averageLatency * (this.metrics.tasksExecuted - 1) + latency) / 
            this.metrics.tasksExecuted;
    }

    updateMetrics(currentTime) {
        if (this.startTime) {
            this.metrics.totalUptime = currentTime - this.startTime;
        }
    }

    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Statistics and monitoring
    getStatistics() {
        return {
            ...this.metrics,
            scheduledTasks: this.scheduledTasks.size,
            intervalTasks: this.intervalTasks.size,
            cronJobs: this.cronJobs.size,
            isRunning: this.isRunning,
            tickCount: this.tickCount,
            uptime: this.metrics.totalUptime
        };
    }

    getUpcomingTasks(limit = 10) {
        const upcoming = [];

        // Scheduled tasks
        for (const task of this.scheduledTasks.values()) {
            upcoming.push({
                id: task.id,
                type: 'scheduled',
                executionTime: task.executionTime,
                status: task.status
            });
        }

        // Cron jobs
        for (const job of this.cronJobs.values()) {
            if (job.status === 'active') {
                upcoming.push({
                    id: job.id,
                    type: 'cron',
                    executionTime: job.nextExecution.getTime(),
                    status: job.status
                });
            }
        }

        // Sort by execution time and limit
        return upcoming
            .sort((a, b) => a.executionTime - b.executionTime)
            .slice(0, limit);
    }

    // Cleanup
    dispose() {
        this.stop();

        // Clear all timeouts and intervals
        for (const timeoutId of this.timeoutTasks.values()) {
            clearTimeout(timeoutId);
        }

        for (const task of this.intervalTasks.values()) {
            if (task.intervalId) {
                clearInterval(task.intervalId);
            }
        }

        this.scheduledTasks.clear();
        this.intervalTasks.clear();
        this.timeoutTasks.clear();
        this.cronJobs.clear();
    }
}

// Additional scheduling utilities
export class Debouncer {
    constructor(delay) {
        this.delay = delay;
        this.timeoutId = null;
    }

    debounce(fn) {
        return (...args) => {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
            
            this.timeoutId = setTimeout(() => {
                fn.apply(null, args);
                this.timeoutId = null;
            }, this.delay);
        };
    }

    cancel() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}

export class Throttler {
    constructor(delay) {
        this.delay = delay;
        this.lastExecution = 0;
        this.timeoutId = null;
        this.pendingArgs = null;
    }

    throttle(fn) {
        return (...args) => {
            const now = Date.now();
            const timeSinceLastExecution = now - this.lastExecution;

            if (timeSinceLastExecution >= this.delay) {
                // Execute immediately
                this.lastExecution = now;
                fn.apply(null, args);
            } else {
                // Schedule for later execution
                this.pendingArgs = args;
                
                if (!this.timeoutId) {
                    this.timeoutId = setTimeout(() => {
                        this.lastExecution = Date.now();
                        fn.apply(null, this.pendingArgs);
                        this.timeoutId = null;
                        this.pendingArgs = null;
                    }, this.delay - timeSinceLastExecution);
                }
            }
        };
    }

    cancel() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
            this.pendingArgs = null;
        }
    }
}

export default TimeScheduler;
