// controllers/deviceController.js
const Device = require('../models/Device');
const User = require('../models/User');

/**
 * @desc    Create new device
 * @route   POST /devices
 * @access  Private
 */
exports.createDevice = async (req, res) => {
  try {
    // Extract from request body
    const { uuid, deviceType, chip, version, isGateway, isEndDevice, gatewayDevice } = req.body;

    // We assume req.user is set by the 'protect' middleware (i.e., the logged-in user)
    const userId = req.user._id;

    // 1. Create the device in DB
    const newDevice = new Device({
      uuid,
      deviceType,
      chip,
      version,
      isGateway,
      isEndDevice,
      gatewayDevice,
      owner: userId, // Link to user
    });
    const savedDevice = await newDevice.save();

    // 2. Add this device to the user's devices array
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
 * @access  Private
 */
exports.getAllDevices = async (req, res) => {
  try {
    // If you want to return only the current user's devices:
    // const devices = await Device.find({ owner: req.user._id }).populate('owner', 'username');
    // Otherwise, get all devices:
    const devices = await Device.find().populate('owner', 'username');
    return res.status(200).json(devices);
  } catch (error) {
    console.error('Error getting devices:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get single device by ID; if gateway, populate sub-devices
 * @route   GET /devices/:id
 * @access  Private
 */
exports.getDeviceById = async (req, res) => {
  try {
    const deviceId = req.params.id;

    // Find device and populate owner and gatewayDevice
    // This will include any sub-devices if the device is a gateway.
    const device = await Device.findById(deviceId)
      .populate('owner', 'username')
      .populate('gatewayDevice'); // Populate sub-devices if it's a gateway

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    return res.status(200).json(device);
  } catch (error) {
    console.error('Error getting device by ID:', error);
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
      gatewayDevice,
    } = req.body;

    // Optionally, you can verify the user is the owner before updating.

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

    // Optionally, check ownership:
    // if (deviceToDelete.owner.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ message: 'Not authorized' });
    // }

    // Remove device from user's devices array
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

/**
 * @desc    Create a new Zigbee device and attach it to an existing Gateway
 * @route   POST /devices/:gatewayId/zigbee
 * @access  Private
 */
exports.addZigbeeDeviceToGateway = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    // We'll allow request body to override certain fields
    const { uuid, version } = req.body;

    // 1. Find the gateway device
    const gatewayDevice = await Device.findById(gatewayId);
    if (!gatewayDevice) {
      return res.status(404).json({ message: 'Gateway device not found' });
    }

    // 2. Check if the found device is actually a gateway
    if (!gatewayDevice.isGateway) {
      return res.status(400).json({ message: 'Provided device is not a gateway' });
    }

    // 3. Create a new Zigbee end device
    const newZigbeeDevice = new Device({
      uuid: uuid || `zigbee-${Date.now()}`,
      deviceType: 'ZigbeeDevice',
      chip: 'Zigbee',
      version: version || '1.0',
      isGateway: false,
      isEndDevice: true,
      owner: req.user._id, // Link to current user
    });

    const savedZigbeeDevice = await newZigbeeDevice.save();

    // 4. Attach the new Zigbee device to the gateway
    gatewayDevice.gatewayDevice.push(savedZigbeeDevice._id);
    await gatewayDevice.save();

    return res.status(201).json({
      message: 'Zigbee device created and attached to gateway',
      zigbeeDevice: savedZigbeeDevice,
    });
  } catch (error) {
    console.error('Error adding Zigbee device to gateway:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllZigbeeDevicesForGateway = async (req, res) => {
    try {
      const { gatewayId } = req.params;
  
      // 1. Find the gateway device
      const gatewayDevice = await Device.findById(gatewayId).populate('gatewayDevice');
      if (!gatewayDevice) {
        return res.status(404).json({ message: 'Gateway device not found' });
      }
  
      if (!gatewayDevice.isGateway) {
        return res.status(400).json({ message: 'Provided device is not a gateway' });
      }
  
      // 2. Filter sub-devices to only Zigbee devices
      const zigbeeDevices = gatewayDevice.gatewayDevice.filter(
        (subDev) => subDev.deviceType === 'ZigbeeDevice'
      );
  
      return res.status(200).json(zigbeeDevices);
    } catch (error) {
      console.error('Error fetching Zigbee devices:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  exports.removeZigbeeDeviceFromGateway = async (req, res) => {
    try {
      const { gatewayId, zigbeeDeviceId } = req.params;
  
      // 1. Find the gateway
      const gatewayDevice = await Device.findById(gatewayId);
      if (!gatewayDevice) {
        return res.status(404).json({ message: 'Gateway device not found' });
      }
      if (!gatewayDevice.isGateway) {
        return res.status(400).json({ message: 'Provided device is not a gateway' });
      }
  
      // 2. Check if zigbeeDeviceId is in gateway's array
      const isAttached = gatewayDevice.gatewayDevice.some(
        (id) => id.toString() === zigbeeDeviceId
      );
      if (!isAttached) {
        return res.status(404).json({ message: 'Zigbee device not found in this gateway' });
      }
  
      // 3. Remove zigbeeDeviceId from gatewayDevice array
      gatewayDevice.gatewayDevice = gatewayDevice.gatewayDevice.filter(
        (id) => id.toString() !== zigbeeDeviceId
      );
      await gatewayDevice.save();
  
      // 4. Delete the Zigbee device from DB
      const zigbeeDevice = await Device.findById(zigbeeDeviceId);
      if (!zigbeeDevice) {
        // If somehow it doesn't exist, stop here
        return res.status(404).json({ message: 'Zigbee device not found in the database' });
      }
  
      // Remove from user's devices array
      await User.findByIdAndUpdate(zigbeeDevice.owner, {
        $pull: { devices: zigbeeDeviceId },
      });
  
      // Finally, remove the device document
      await zigbeeDevice.deleteOne();
  
      return res.status(200).json({ message: 'Zigbee device removed from gateway and deleted' });
    } catch (error) {
      console.error('Error removing Zigbee device from gateway:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };