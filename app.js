// app.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const fs = require('fs');
const path = require('path');
const http = require('http'); // For creating HTTP server
const mqtt = require('mqtt'); // Import MQTT

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/token', tokenRoutes);

// Serve certificates statically (if needed)
app.use('/certs', express.static(path.join(__dirname, 'certs')));

// Default Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Setup Socket.IO on the HTTP server
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this for production!
    methods: ["GET", "POST"]
  }
});

// MQTT broker connection configuration with mutual TLS
const mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtts://mqtt.lygoiq.com:8883'; // Use mqtts:// for TLS
const mqttOptions = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  // Read the certificate files. Adjust the paths if necessary.
  key: fs.readFileSync(path.join(__dirname, 'certs', 'mqttTest.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'mqttTest.crt')),
  ca: fs.readFileSync(path.join(__dirname, 'certs', 'mqttCa.crt')),
  rejectUnauthorized: true, // Only accept authorized certificates
  // Additional options as required by your MQTT broker.
};

const mqttClient = mqtt.connect(mqttBrokerUrl, mqttOptions);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker with mTLS');
});

mqttClient.on('error', (err) => {
  console.error('MQTT Connection error: ', err);
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Listen for a custom "data" event from clients
  socket.on('data', (data) => {
    console.log('Received data via socket:', data);

    // Ensure that the data object contains an "id" property.
    if (!data.id) {
      console.error('Data does not contain an "id" property. Cannot determine MQTT topic.');
      return;
    }

    // Construct the MQTT topic, e.g., "commands/<deviceId>"
    const topic = `aswar/${data.id}`;

    // Publish the message to the MQTT broker.
    mqttClient.publish(topic, JSON.stringify(data), (err) => {
      if (err) {
        console.error('Failed to publish to MQTT topic:', topic, err);
      } else {
        console.log(`Published data to MQTT topic "${topic}"`);
      }
    });

    // Optionally, broadcast the data to all connected Socket.IO clients
    io.emit('data', data);
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
