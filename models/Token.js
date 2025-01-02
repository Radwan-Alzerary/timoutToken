// models/Token.js
const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  uuid: {
    type: String,
    required: true,
    unique: true,
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
  signedCert: {
    type: String, // Path to the signed certificate
    required: true,
  },
});

module.exports = mongoose.model('Token', TokenSchema);
