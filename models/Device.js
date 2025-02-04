const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  uuid: {
    type: String,
    unique: true,
    // required: true
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  deviceType: {
    type: String,
    required: true,
  },
  chip: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  firmwareVersion: {
    type: String,
  },
  isGateway: {
    type: Boolean,
    default: false
  },
  isEndDevice: {
    type: Boolean,
    default: false
  },
  gatewayDevice: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  }],

  // Networking
  ipAddress: String,
  macAddress: String,
  connectionType: {
    type: String,
    enum: ['WiFi', 'Ethernet', 'Cellular', 'LoRa', 'Bluetooth', 'Other']
  },

  // Status & Diagnostics
  online: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  signalStrength: {
    type: Number
  },

  // Location
  location: {
    type: String
  },
  coordinates: {
    lat: Number,
    lng: Number
  },

  // Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Telemetry (example)
  latestTelemetry: {
    temperature: Number,
    humidity: Number,
  },
  // If you want full logs or a separate table
  telemetryHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Telemetry'
  }],

  // Configuration
  config: {
    type: Object
  },

  tags: [{
    type: String
  }],

}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
