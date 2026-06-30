const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables FIRST before importing routes/services
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const questionRoutes = require('./routes/questionRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const historyRoutes = require('./routes/historyRoutes');
const statsRoutes = require('./routes/statsRoutes');

app.use('/api/questions', questionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/stats', statsRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
