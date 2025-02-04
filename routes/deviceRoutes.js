// routes/deviceRoutes.js
const express = require('express');
const router = express.Router();

const {
  createDevice,
  getAllDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
} = require('../controllers/deviceController');

// You may have an auth middleware here if needed
const { protect } = require('../middlewares/authMiddleware');

// CREATE
router.post('/', protect,  createDevice);

// READ ALL
router.get('/',  protect, getAllDevices);

// READ ONE
router.get('/:id' ,protect,  getDeviceById);

// UPDATE
router.put('/:id',  protect,  updateDevice);

// DELETE
router.delete('/:id',  protect, deleteDevice);

module.exports = router;
