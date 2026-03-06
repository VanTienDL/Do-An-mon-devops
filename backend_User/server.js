const express = require('express');
require('dotenv').config();

const userRoutes = require('./src/routes/user.routes');

const app = express();

app.use(express.json());

app.use('/api/user', userRoutes);

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});