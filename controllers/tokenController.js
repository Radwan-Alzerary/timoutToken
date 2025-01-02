// controllers/tokenController.js
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Token = require('../models/Token');
const { createSignedCert } = require('../utils/generateCert');

dotenv.config();

// Paths to CA files
const CA_CERT_PATH = path.join(__dirname, '../', process.env.CA_CERT_PATH);

// Function to read CA certificate
const getCACert = () => {
  try {
    const caCert = fs.readFileSync(CA_CERT_PATH, 'utf8');
    return caCert;
  } catch (error) {
    console.error('Error reading CA certificate:', error);
    return null;
  }
};

// @desc    Generate a token with expiration time (Public)
const generateTokenRoute = async (req, res) => {
  const { timeInMinutes } = req.body;

  if (!timeInMinutes || typeof timeInMinutes !== 'number') {
    return res.status(400).json({ message: 'Invalid timeInMinutes' });
  }

  try {
    const token = uuidv4(); // Generate a unique token
    const expiresAt = new Date(Date.now() + timeInMinutes * 60000); // Current time + minutes

    // Generate a unique UUID for the token
    const uuid = uuidv4();

    // Save token to DB
    const newToken = new Token({
      token,
      expiresAt,
      uuid,
      deviceType: '',
      chip: '',
      version: '',
      signedCert: '',
    });

    await newToken.save();

    res.status(201).json({
      token: newToken.token,
    //   expiresAt: newToken.expiresAt,
    //   uuid: newToken.uuid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// @desc    Submit token details and receive UUID with signed cert (Public)
const submitToken = async (req, res) => {
  const { Token: token, "Device type": deviceType, Chip: chip, Version: version } = req.body;

  if (!token || !deviceType || !chip || !version) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find the token
    const existingToken = await Token.findOne({ token });

    if (!existingToken) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    if (existingToken.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Token has expired' });
    }

    if (existingToken.signedCert) {
      return res.status(400).json({ message: 'Certificate already issued for this token' });
    }

    // Update token details
    existingToken.deviceType = deviceType;
    existingToken.chip = chip;
    existingToken.version = version;

    // Generate and sign certificate
    const certData = await createSignedCert(existingToken.uuid);

    existingToken.signedCert = certData.certPath;

    await existingToken.save();

    // Get CA Certificate
    const caCert = getCACert();

    res.status(200).json({
      uuid: existingToken.uuid,
      signedCert: certData.signedCert,
      caCert, // Include CA certificate in the response
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// @desc    Generate a token with expiration time (Protected)
const generateTokenProtected = async (req, res) => {
  const { timeInMinutes } = req.body;

  if (!timeInMinutes || typeof timeInMinutes !== 'number') {
    return res.status(400).json({ message: 'Invalid timeInMinutes' });
  }

  try {
    const token = uuidv4(); // Generate a unique token
    const expiresAt = new Date(Date.now() + timeInMinutes * 60000); // Current time + minutes

    // Generate a unique UUID for the token
    const uuid = uuidv4();

    // Save token to DB
    const newToken = new Token({
      token,
      expiresAt,
      uuid,
      deviceType: '',
      chip: '',
      version: '',
      signedCert: '',
    });

    await newToken.save();

    res.status(201).json({
      token: newToken.token,
      expiresAt: newToken.expiresAt,
      uuid: newToken.uuid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// @desc    Submit token details and receive UUID with signed cert (Protected)
const submitTokenProtected = async (req, res) => {
  const { Token: token, "Device type": deviceType, Chip: chip, Version: version } = req.body;

  if (!token || !deviceType || !chip || !version) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find the token
    const existingToken = await Token.findOne({ token });

    if (!existingToken) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    if (existingToken.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Token has expired' });
    }

    if (existingToken.signedCert) {
      return res.status(400).json({ message: 'Certificate already issued for this token' });
    }

    // Update token details
    existingToken.deviceType = deviceType;
    existingToken.chip = chip;
    existingToken.version = version;

    // Generate and sign certificate
    const certData = await createSignedCert(existingToken.uuid);

    existingToken.signedCert = certData.certPath;

    await existingToken.save();

    // Get CA Certificate
    const caCert = getCACert();

    res.status(200).json({
      uuid: existingToken.uuid,
      signedCert: certData.signedCert,
      caCert, // Include CA certificate in the response
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

module.exports = {
  generateTokenRoute,
  submitToken,
  generateTokenProtected,
  submitTokenProtected,
};
