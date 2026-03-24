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

// Services
const trafficController = require('./services/TrafficController');
const logService = require('./services/LogService');
const hwSync = require('./services/HardwareSyncService');
const geoAlerts = require('./services/GeoFencedAlertService');

// Initialize services with socket.io instance
logService.init(io);
hwSync.init(io);
geoAlerts.init(io);
trafficController.init(io);

// Routes
const authRoutes = require('./routes/auth');
const iotRoutes = require('./routes/iot');

app.use('/api/auth', authRoutes);
app.use('/api/iot', iotRoutes);

// Static files and SPA fallback
app.use(express.static(path.join(__dirname, 'public')));

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
      // 1. Pass data into the Advanced Predictive ETA Engine Execution Layer
      trafficController.processPredictiveTelemetry(data);
      
      // 2. Pass data into Geo-Fenced Proximity Engine
      geoAlerts.processCivilianProximity(data);

      io.emit('ambulance-location-update', data);
  });

  // Handle Hospital Alerts from Drivers
  socket.on('hospital-alert', (data) => {
      console.log(`Hospital Alert: ${data.hospitalId} regarding patient: ${data.problem}`);
      // Notify the specific hospital (or all for demo simplicity)
      io.emit('hospital-alert-received', {
          ...data,
          timestamp: new Date().toISOString(),
          alertId: 'ALT-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      });
      logService.addLog(`Emergency alert sent to ${data.hospitalName}: ${data.problem}`, data.critical ? 'warning' : 'info');
  });

  // Handle Hospital Acknowledgment
  socket.on('hospital-acknowledgment', (data) => {
      console.log(`Hospital Acknowledgment: ${data.hospitalName} is ${data.status}`);
      io.emit('hospital-response-update', data);
      logService.addLog(`${data.hospitalName} acknowledged: ${data.status}`, 'info');
  });

  // Two-way Messaging
  socket.on('hospital-to-driver-message', (data) => {
      io.emit('hospital-message-received', data);
  });

  socket.on('driver-to-hospital-message', (data) => {
      io.emit('driver-message-received', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
