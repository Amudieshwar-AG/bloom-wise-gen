const express = require('express');
const router = express.Router();
const statsModel = require('../models/statsModel');

router.get('/', (req, res) => {
  try {
    const stats = statsModel.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

module.exports = router;
