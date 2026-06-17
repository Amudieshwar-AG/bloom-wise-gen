const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables FIRST before importing routes/services
dotenv.config();

const questionRoutes = require('./routes/questionRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/questions', questionRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
