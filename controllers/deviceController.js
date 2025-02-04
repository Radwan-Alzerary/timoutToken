// controllers/deviceController.js
const Device = require('../models/Device');
const User = require('../models/User');

/**
 * @desc    Create new device
 * @route   POST /devices
 * @access  Private (assuming user must be logged in)
 */
exports.createDevice = async (req, res) => {
  try {
    // 1. Get data from request body
    const { uuid, deviceType, chip, version, isGateway, isEndDevice, gatewayDevice } = req.body;

    // 2. Suppose we have userId from auth middleware or token
    const userId = req.user._id; 
    // OR if it's in the body for test, const { userId } = req.body;

    // 3. Create device in DB
    const newDevice = new Device({
      uuid,
      deviceType,
      chip,
      version,
      isGateway,
      isEndDevice,
      gatewayDevice,
      owner: userId, // link to user
    });
    const savedDevice = await newDevice.save();

    // 4. Update user document to add this device
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.devices.push(savedDevice._id);
    await user.save();

    return res.status(201).json({
      message: 'Device created successfully',
      device: savedDevice,
    });
  } catch (error) {
    console.error('Error creating device:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get all devices
 * @route   GET /devices
 * @access  Private or Public (depending on your use case)
 */
exports.getAllDevices = async (req, res) => {
  try {
    // If you want to filter by user, you can do so
    // const userId = req.user._id;
    // const devices = await Device.find({ owner: userId });

    const devices = await Device.find().populate('owner', 'username');
    return res.status(200).json(devices);
  } catch (error) {
    console.error('Error getting devices:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get single device by ID
 * @route   GET /devices/:id
 * @access  Private or Public
 */
exports.getDeviceById = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const device = await Device.findById(deviceId).populate('owner', 'username');
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    return res.status(200).json(device);
  } catch (error) {
    console.error('Error getting device:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Update device by ID
 * @route   PUT /devices/:id
 * @access  Private
 */
exports.updateDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { 
      uuid, 
      deviceType, 
      chip, 
      version, 
      isGateway, 
      isEndDevice, 
      gatewayDevice 
    } = req.body;

    // Optionally, you can verify the user is the owner before updating
    // e.g. if (req.user._id !== device.owner.toString()) { ... }

    const updatedDevice = await Device.findByIdAndUpdate(
      deviceId,
      {
        uuid,
        deviceType,
        chip,
        version,
        isGateway,
        isEndDevice,
        gatewayDevice,
      },
      { new: true }
    );

    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }

    return res.status(200).json({
      message: 'Device updated successfully',
      device: updatedDevice,
    });
  } catch (error) {
    console.error('Error updating device:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Delete device by ID
 * @route   DELETE /devices/:id
 * @access  Private
 */
exports.deleteDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;

    const deviceToDelete = await Device.findById(deviceId);
    if (!deviceToDelete) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Optional: Check if the user is the owner
    // if (deviceToDelete.owner.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ message: 'Not authorized' });
    // }

    // Remove device from user’s devices array
    await User.findByIdAndUpdate(deviceToDelete.owner, {
      $pull: { devices: deviceId },
    });

    // Delete the device
    await deviceToDelete.deleteOne();

    return res.status(200).json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
