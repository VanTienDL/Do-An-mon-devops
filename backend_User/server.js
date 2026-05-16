// backend_User/server.js
require('dotenv').config();
const express = require('express');
const app = express();

const { register, httpRequestDuration, httpRequestTotal } = require('./metrics');
const userRoutes = require('./src/routes/user.routes');

app.use(express.json());

// Prometheus middleware
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

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`User service running on port ${PORT}`));