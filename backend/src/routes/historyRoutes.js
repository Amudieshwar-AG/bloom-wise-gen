const express = require('express');
const router = express.Router();
const historyModel = require('../models/historyModel');

router.get('/', (req, res) => {
  try {
    const history = historyModel.getAllHistory();
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

module.exports = router;
