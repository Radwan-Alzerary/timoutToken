// routes/certRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// @desc    Get CA Certificate
// @route   GET /api/cert/ca
// @access  Public
router.get('/ca', (req, res) => {
  const caCertPath = path.join(__dirname, '../', process.env.CA_CERT_PATH);

  res.sendFile(caCertPath, (err) => {
    if (err) {
      console.error('Error sending CA certificate:', err);
      res.status(500).json({ message: 'Failed to retrieve CA certificate' });
    }
  });
});

module.exports = router;
