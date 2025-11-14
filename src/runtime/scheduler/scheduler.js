// Production Stream Scheduler with Priority Queues
export class StreamScheduler {
    constructor() {
        this.liveStreams = new Set();
        this.finiteStreams = new Set();
        this.priorityQueue = new PriorityQueue();
        this.running = false;
        this.tickInterval = null;
    }

    schedule(stream, priority = 0) {
        if (stream.isLive) {
            this.liveStreams.add(stream);
            this.priorityQueue.enqueue(stream, priority);
        } else {
            this.finiteStreams.add(stream);
        }
    }

    unschedule(stream) {
        this.liveStreams.delete(stream);
        this.finiteStreams.delete(stream);
        this.priorityQueue.remove(stream);
    }

    async start() {
        if (this.running) return;
        
        this.running = true;
        this.tickInterval = setInterval(() => this.tick(), 16); // ~60fps
        
        // Process finite streams once
        await this.processFiniteStreams();
    }

    async stop() {
        this.running = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    async tick() {
        if (!this.running) return;
        
        // Process high-priority live streams
        const batchSize = 10;
        for (let i = 0; i < batchSize && !this.priorityQueue.isEmpty(); i++) {
            const stream = this.priorityQueue.dequeue();
            if (stream && stream.isActive) {
                try {
                    await stream.tick();
                    // Requeue if still active
                    if (stream.isActive) {
                        this.priorityQueue.enqueue(stream, stream.priority);
                    }
                } catch (error) {
                    console.error('Stream tick error:', error);
                }
            }
        }
    }

    async processFiniteStreams() {
        for (const stream of this.finiteStreams) {
            if (stream.isActive) {
                try {
                    await stream.process();
                } catch (error) {
                    console.error('Finite stream processing error:', error);
                }
            }
        }
    }

    getStats() {
        return {
            liveStreams: this.liveStreams.size,
            finiteStreams: this.finiteStreams.size,
            queueSize: this.priorityQueue.size,
            running: this.running
        };
    }
}

class PriorityQueue {
    constructor() {
        this.heap = [];
    }

    enqueue(item, priority) {
        this.heap.push({ item, priority });
        this.heap.sort((a, b) => b.priority - a.priority); // Max-heap
    }

    dequeue() {
        return this.heap.shift()?.item;
    }

    remove(item) {
        this.heap = this.heap.filter(entry => entry.item !== item);
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    get size() {
        return this.heap.length;
    }
}

export default StreamScheduler;
