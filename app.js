// app.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const fs = require('fs');
const path = require('path');
const http = require('http'); // Import http to create server

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/token', tokenRoutes);

// Serve certificates statically
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
    origin: "*", // Allow all origins - adjust this for production!
    methods: ["GET", "POST"]
  }
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Listen for a custom "data" event from clients
  socket.on('data', (data) => {
    console.log('Received data via socket:', data);
    
    // Example: broadcast the received data to all connected clients
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
