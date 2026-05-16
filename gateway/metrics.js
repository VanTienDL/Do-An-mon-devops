// gateway/metrics.js
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'gateway_' });

const httpRequestDuration = new client.Histogram({
    name: 'gateway_http_request_duration_seconds',
    help: 'Duration of HTTP requests through gateway',
    labelNames: ['method', 'route', 'status_code', 'target_service'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5],
    registers: [register]
});

const httpRequestTotal = new client.Counter({
    name: 'gateway_http_requests_total',
    help: 'Total number of HTTP requests through gateway',
    labelNames: ['method', 'route', 'status_code', 'target_service'],
    registers: [register]
});

const proxyErrorTotal = new client.Counter({
    name: 'gateway_proxy_errors_total',
    help: 'Total number of proxy errors',
    labelNames: ['target_service'],
    registers: [register]
});

module.exports = { register, httpRequestDuration, httpRequestTotal, proxyErrorTotal };