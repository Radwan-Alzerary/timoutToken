// routes/deviceRoutes.js
const express = require('express');
const router = express.Router();

// Import controller functions
const {
    createDevice,
    getAllDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
    addZigbeeDeviceToGateway,
    getAllZigbeeDevicesForGateway,
    removeZigbeeDeviceFromGateway
} = require('../controllers/deviceController');

// Import auth middleware
const { protect } = require('../middlewares/authMiddleware');

// ----------------------
// CRUD Endpoints
// ----------------------
router.post('/', protect, createDevice);        // Create
router.get('/', protect, getAllDevices);       // Read All
router.get('/:id', protect, getDeviceById);    // Read One
router.put('/:id', protect, updateDevice);     // Update
router.delete('/:id', protect, deleteDevice);  // Delete

// ----------------------
// Zigbee-Gateway Endpoint
// ----------------------
router.post('/:gatewayId/zigbee', protect, addZigbeeDeviceToGateway);            // Add zigbee device to gateway
router.get('/:gatewayId/zigbee', protect, getAllZigbeeDevicesForGateway);        // Get all zigbee devices under gateway
router.delete('/:gatewayId/zigbee/:zigbeeDeviceId', protect, removeZigbeeDeviceFromGateway); // Remove Zigbee device

module.exports = router;
