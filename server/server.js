const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

// Import routes
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');
const deleteRoutes = require('./routes/deleteRoutes');

// Import constants
const { PORT } = require('./config/constants');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', folderRoutes);
app.use('/', fileRoutes);
app.use('/', deleteRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
