// routes/tokenRoutes.js
const express = require('express');
const router = express.Router();
const {
  generateTokenRoute,
  submitToken,
  generateTokenProtected,
  submitTokenProtected,
} = require('../controllers/tokenController');
const { protect } = require('../middlewares/authMiddleware');

// Public Routes
router.post('/generate', generateTokenRoute);
router.post('/submit', submitToken);

// Protected Routes
router.post('/generate-protected', protect, generateTokenProtected);
router.post('/submit-protected', protect, submitTokenProtected);

module.exports = router;
