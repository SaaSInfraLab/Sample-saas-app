const promClient = require('express-prometheus-middleware');

/**
 * Prometheus metrics middleware
 * Exposes metrics at /metrics endpoint
 */
const metricsMiddleware = promClient({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 3, 5, 10],
  requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
  responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
  authenticate: false,
  metricsApp: null,
});

module.exports = metricsMiddleware;

