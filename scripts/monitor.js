const os = require('os');
const fs = require('fs');
const path = require('path');

class SystemMonitor {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      system: {},
      application: {},
      database: {}
    };
  }

  // Collect system metrics
  collectSystemMetrics() {
    this.metrics.system = {
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: os.totalmem() - os.freemem(),
      memoryUsage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      networkInterfaces: Object.keys(os.networkInterfaces()).length
    };
  }

  // Collect application metrics
  collectApplicationMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.application = {
      nodeVersion: process.version,
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch
    };
  }

  // Collect database metrics (placeholder)
  collectDatabaseMetrics() {
    this.metrics.database = {
      status: 'connected',
      connectionPool: {
        active: 0,
        idle: 0,
        total: 0
      },
      queries: {
        total: 0,
        slow: 0,
        errors: 0
      }
    };
  }

  // Generate health report
  generateHealthReport() {
    this.collectSystemMetrics();
    this.collectApplicationMetrics();
    this.collectDatabaseMetrics();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: []
    };

    // Check memory usage
    if (this.metrics.system.memoryUsage > 90) {
      health.alerts.push({
        level: 'critical',
        message: 'High memory usage detected',
        value: `${this.metrics.system.memoryUsage}%`
      });
      health.status = 'critical';
    } else if (this.metrics.system.memoryUsage > 80) {
      health.alerts.push({
        level: 'warning',
        message: 'Memory usage is high',
        value: `${this.metrics.system.memoryUsage}%`
      });
      health.status = 'warning';
    }

    // Check CPU load
    const loadAvg = this.metrics.system.loadAverage[0];
    if (loadAvg > this.metrics.system.cpuCount * 2) {
      health.alerts.push({
        level: 'critical',
        message: 'High CPU load detected',
        value: loadAvg.toFixed(2)
      });
      health.status = 'critical';
    } else if (loadAvg > this.metrics.system.cpuCount) {
      health.alerts.push({
        level: 'warning',
        message: 'CPU load is high',
        value: loadAvg.toFixed(2)
      });
      if (health.status === 'healthy') {
        health.status = 'warning';
      }
    }

    return health;
  }

  // Save metrics to file
  saveMetrics(filename = 'metrics.json') {
    const health = this.generateHealthReport();
    const filepath = path.join(__dirname, '..', 'logs', filename);
    
    // Ensure logs directory exists
    const logsDir = path.dirname(filepath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(health, null, 2));
    return health;
  }

  // Start continuous monitoring
  startMonitoring(intervalMs = 60000) {
    console.log('Starting system monitoring...');
    
    setInterval(() => {
      const health = this.saveMetrics();
      console.log(`Health check: ${health.status} - ${health.alerts.length} alerts`);
      
      if (health.status === 'critical') {
        console.error('CRITICAL: System health is critical!');
        // Here you could send alerts to monitoring services
      }
    }, intervalMs);
  }
}

module.exports = SystemMonitor;

// If run directly, start monitoring
if (require.main === module) {
  const monitor = new SystemMonitor();
  monitor.startMonitoring();
}
