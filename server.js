const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables if any
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Services
const trafficController = require('./services/TrafficController');
const logService = require('./services/LogService');

// Initialize services with socket.io instance
logService.init(io);
trafficController.init(io);

// Routes
const authRoutes = require('./routes/auth');
const iotRoutes = require('./routes/iot');

app.use('/api/auth', authRoutes);
app.use('/api/iot', iotRoutes);

// Fallback to index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Send initial data
  socket.emit('traffic-state', trafficController.getState());
  socket.emit('initial-logs', logService.getLogs());
  socket.emit('density-state', trafficController.getDestiny());

  // Handle location relay
  socket.on('driver-location', (data) => {
      io.emit('ambulance-location-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
