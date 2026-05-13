// backend_User/server.js

require('dotenv').config();

const express = require('express');
const app = express();

// Prometheus metrics
const {
    register,
    httpRequestDuration,
    httpRequestTotal
} = require('./src/metrics');

// Routes
const userRoutes = require('./src/routes/user.routes');

// Middleware parse JSON
app.use(express.json());

/**
 * Middleware đo thời gian và số lượng HTTP request
 */
app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();

    res.on('finish', () => {
        const labels = {
            method: req.method,
            route: req.route?.path || req.path,
            status_code: res.statusCode
        };

        end(labels);
        httpRequestTotal.inc(labels);
    });

    next();
});

/**
 * Endpoint cho Prometheus scrape metrics
 */
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

/**
 * API Routes
 */
app.use('/api/user', userRoutes);

/**
 * Start server
 */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
});