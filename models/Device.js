// models/Device.js
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      unique: true,
      // required: true,  // Uncomment if needed
    },
    deviceType: {
      type: String,
      // required: true,
    },
    chip: {
      type: String,
      // required: true,
    },
    version: {
      type: String,
      // required: true,
    },
    gateway:{type:Boolean,default:false},
    
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
