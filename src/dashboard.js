// FILENAME: src/dashboard.js
// Fluxus Professional Dashboard

import http from 'http';
import { EventEmitter } from 'events';

export class FluxusDashboard extends EventEmitter {
    constructor(engine, port = 3000) {
        super();
        this.engine = engine;
        this.port = port;
        this.server = null;
        this.metricsHistory = [];
        
        this.metrics = {
            streamExecutions: 0,
            poolUpdates: 0,
            activePools: 0,
            performance: {
                avgExecutionTime: 0,
                maxExecutionTime: 0,
                totalMemory: 0,
                uptime: 0
            },
            streams: {
                total: 0,
                active: 0,
                completed: 0
            }
        };
    }

    start() {
        this.server = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`📊 Fluxus Dashboard running at http://localhost:${this.port}`);
            console.log(`   🌐 Open in browser to monitor streams in real-time`);
            console.log(`   🔄 Auto-refreshes every 3 seconds`);
        });

        this.startMetricsCollection();
        this.startTime = Date.now();
    }

    handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        // Set CORS headers for all responses
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        switch (url.pathname) {
            case '/':
            case '/index.html':
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getDashboardHTML());
                break;
            case '/api/metrics':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getCurrentState()));
                break;
            case '/api/pools':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.engine.pools));
                break;
            case '/api/streams':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getStreamStats()));
                break;
            case '/api/health':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'healthy', uptime: Date.now() - this.startTime }));
                break;
            default:
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Endpoint not found' }));
        }
    }

    getCurrentState() {
        const uptime = Date.now() - this.startTime;
        return {
            pools: this.engine.pools,
            metrics: {
                ...this.metrics,
                activePools: Object.keys(this.engine.pools).length,
                performance: {
                    ...this.metrics.performance,
                    totalMemory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    uptime: Math.round(uptime / 1000)
                },
                history: this.metricsHistory.slice(-20) // Last 20 data points
            },
            timestamp: new Date().toISOString()
        };
    }

    getStreamStats() {
        return {
            total: this.metrics.streamExecutions,
            active: 0, // Would track active streams in a real implementation
            completed: this.metrics.streamExecutions,
            byType: {
                finite: this.metrics.streamExecutions,
                live: 0
            }
        };
    }

    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fluxus Stream Dashboard</title>
    <style>
        :root {
            --primary: #2563eb;
            --secondary: #7c3aed;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --dark: #1e293b;
            --darker: #0f172a;
            --light: #f8fafc;
            --gray: #64748b;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, var(--darker) 0%, var(--dark) 100%);
            color: var(--light);
            min-height: 100vh;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .header p {
            color: var(--gray);
            font-size: 1.1rem;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .panel {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.2s, border-color 0.2s;
        }
        
        .panel:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        .panel h2 {
            font-size: 1.3rem;
            margin-bottom: 15px;
            color: var(--primary);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.08);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 1.8rem;
            font-weight: bold;
            margin: 5px 0;
            color: var(--success);
        }
        
        .metric-label {
            font-size: 0.9rem;
            color: var(--gray);
        }
        
        .pool-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .pool-item {
            background: rgba(255, 255, 255, 0.08);
            margin: 8px 0;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid var(--primary);
        }
        
        .pool-name {
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 5px;
        }
        
        .pool-value {
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.3);
            padding: 4px 8px;
            border-radius: 4px;
            margin: 5px 0;
            word-break: break-all;
        }
        
        .pool-meta {
            font-size: 0.8rem;
            color: var(--gray);
            display: flex;
            justify-content: space-between;
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-active { background: var(--success); }
        .status-warning { background: var(--warning); }
        .status-error { background: var(--error); }
        
        .controls {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: var(--primary);
            color: white;
            cursor: pointer;
            transition: background 0.2s;
            font-size: 0.9rem;
        }
        
        .btn:hover {
            background: #1d4ed8;
        }
        
        .btn-secondary {
            background: var(--gray);
        }
        
        .btn-secondary:hover {
            background: #475569;
        }
        
        .last-update {
            text-align: center;
            color: var(--gray);
            font-size: 0.9rem;
            margin-top: 20px;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 6px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 3px;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .metric-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌊 Fluxus Stream Dashboard</h1>
            <p>Real-time monitoring of reactive streams and tidal pools</p>
        </div>
        
        <div class="dashboard-grid">
            <!-- Performance Metrics -->
            <div class="panel">
                <h2>📈 Performance Metrics</h2>
                <div class="metric-grid" id="metrics">
                    <div class="metric-card">
                        <div class="metric-label">Stream Executions</div>
                        <div class="metric-value" id="streamCount">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Pool Updates</div>
                        <div class="metric-value" id="poolUpdates">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Active Pools</div>
                        <div class="metric-value" id="activePools">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Memory Usage</div>
                        <div class="metric-value" id="memoryUsage">0MB</div>
                    </div>
                </div>
            </div>
            
            <!-- System Status -->
            <div class="panel">
                <h2>⚡ System Status</h2>
                <div id="systemStatus">
                    <div style="margin-bottom: 15px;">
                        <span class="status-indicator status-active"></span>
                        <span>Engine: <strong>Running</strong></span>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <span class="status-indicator status-active"></span>
                        <span>Streams: <strong id="streamStatus">Active</strong></span>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <span class="status-indicator status-active"></span>
                        <span>Memory: <strong id="memoryStatus">Stable</strong></span>
                    </div>
                    <div>
                        <span class="status-indicator status-active"></span>
                        <span>Uptime: <strong id="uptime">0s</strong></span>
                    </div>
                </div>
            </div>
            
            <!-- Tidal Pools -->
            <div class="panel">
                <h2>🏊 Tidal Pools</h2>
                <div class="pool-list" id="poolsContainer">
                    <div class="pool-item">
                        <div class="pool-name">Loading pools...</div>
                    </div>
                </div>
            </div>
            
            <!-- Stream Statistics -->
            <div class="panel">
                <h2>🔄 Stream Statistics</h2>
                <div id="streamStats">
                    <div class="metric-card">
                        <div class="metric-label">Total Streams</div>
                        <div class="metric-value" id="totalStreams">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Active Streams</div>
                        <div class="metric-value" id="activeStreams">0</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Completed</div>
                        <div class="metric-value" id="completedStreams">0</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="loadData()">🔄 Refresh Data</button>
            <button class="btn btn-secondary" onclick="clearData()">🗑️ Clear Console</button>
            <button class="btn btn-secondary" onclick="exportData()">📥 Export Data</button>
        </div>
        
        <div class="last-update" id="lastUpdate">
            Last updated: <span id="updateTime">Never</span>
        </div>
    </div>

    <script>
        let autoRefresh = true;
        
        async function loadData() {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                updateDashboard(data);
                
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
                showError('Failed to connect to Fluxus engine');
            }
        }
        
        function updateDashboard(data) {
            // Update metrics
            document.getElementById('streamCount').textContent = data.metrics.streamExecutions;
            document.getElementById('poolUpdates').textContent = data.metrics.poolUpdates;
            document.getElementById('activePools').textContent = data.metrics.activePools;
            document.getElementById('memoryUsage').textContent = data.metrics.performance.totalMemory + 'MB';
            document.getElementById('uptime').textContent = data.metrics.performance.uptime + 's';
            
            // Update pools
            updatePools(data.pools);
            
            // Update stream stats
            document.getElementById('totalStreams').textContent = data.metrics.streamExecutions;
            document.getElementById('activeStreams').textContent = data.metrics.streams.active;
            document.getElementById('completedStreams').textContent = data.metrics.streams.completed;
            
            // Update timestamp
            document.getElementById('updateTime').textContent = new Date(data.timestamp).toLocaleTimeString();
            
            // Update status indicators
            updateStatusIndicators(data);
        }
        
        function updatePools(pools) {
            const container = document.getElementById('poolsContainer');
            
            if (!pools || Object.keys(pools).length === 0) {
                container.innerHTML = '<div class="pool-item"><div class="pool-name">No active pools</div></div>';
                return;
            }
            
            container.innerHTML = '';
            Object.entries(pools).forEach(([name, pool]) => {
                const poolEl = document.createElement('div');
                poolEl.className = 'pool-item';
                
                const value = formatValue(pool.value);
                const updates = pool._updates || 0;
                const type = Array.isArray(pool.value) ? 'Array' : typeof pool.value;
                const size = Array.isArray(pool.value) ? pool.value.length : null;
                
                poolEl.innerHTML = \`
                    <div class="pool-name">\${name}</div>
                    <div class="pool-value">\${value}</div>
                    <div class="pool-meta">
                        <span>Type: \${type}\${size ? \` (\${size})\` : ''}</span>
                        <span>Updates: \${updates}</span>
                    </div>
                \`;
                
                container.appendChild(poolEl);
            });
        }
        
        function updateStatusIndicators(data) {
            // Update memory status
            const memory = data.metrics.performance.totalMemory;
            const memoryStatus = document.getElementById('memoryStatus');
            if (memory > 100) {
                memoryStatus.innerHTML = '<span style="color: var(--warning)">High</span>';
            } else if (memory > 50) {
                memoryStatus.innerHTML = '<span style="color: var(--warning)">Moderate</span>';
            } else {
                memoryStatus.innerHTML = '<span style="color: var(--success)">Stable</span>';
            }
        }
        
        function formatValue(value) {
            if (value === null || value === undefined) return 'null';
            if (Array.isArray(value)) {
                return \`[\${value.slice(0, 5).join(', ')}\${value.length > 5 ? ', ...' : ''}]\`;
            }
            if (typeof value === 'object') {
                return '{ ... }'; // Simplified object display
            }
            return String(value);
        }
        
        function showError(message) {
            const container = document.getElementById('poolsContainer');
            container.innerHTML = \`<div class="pool-item" style="border-left-color: var(--error);">
                <div class="pool-name">Error</div>
                <div class="pool-value">\${message}</div>
            </div>\`;
        }
        
        function clearData() {
            // In a real implementation, this would clear engine data
            console.log('Clear functionality would be implemented here');
        }
        
        function exportData() {
            // Export current state as JSON
            fetch('/api/metrics')
                .then(r => r.json())
                .then(data => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`fluxus-dashboard-\${new Date().toISOString()}.json\`;
                    a.click();
                    URL.revokeObjectURL(url);
                });
        }
        
        // Auto-refresh every 3 seconds
        setInterval(() => {
            if (autoRefresh) {
                loadData();
            }
        }, 3000);
        
        // Load initial data
        loadData();
        
        // Handle visibility change to pause auto-refresh when tab is not visible
        document.addEventListener('visibilitychange', () => {
            autoRefresh = !document.hidden;
        });
    </script>
</body>
</html>
        `;
    }

    startMetricsCollection() {
        setInterval(() => {
            this.metrics.activePools = Object.keys(this.engine.pools).length;
            this.metrics.performance.totalMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
            this.metrics.performance.uptime = Math.round((Date.now() - this.startTime) / 1000);
            
            // Store metrics history
            this.metricsHistory.push({
                timestamp: Date.now(),
                streamExecutions: this.metrics.streamExecutions,
                poolUpdates: this.metrics.poolUpdates,
                activePools: this.metrics.activePools,
                memory: this.metrics.performance.totalMemory
            });
            
            // Keep only last 100 data points
            if (this.metricsHistory.length > 100) {
                this.metricsHistory.shift();
            }
        }, 2000);
    }

    onPoolUpdate(poolName, newValue) {
        this.metrics.poolUpdates++;
        this.emit('poolUpdate', { poolName, value: newValue });
    }

    onStreamExecution(code, result) {
        this.metrics.streamExecutions++;
        this.emit('streamExecution', { code, result });
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('📊 Dashboard stopped');
        }
    }
}
