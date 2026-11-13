const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const postRoutes = require('./routes/posts');
const conversationRoutes = require('./routes/conversations');
const { initSocket } = require('./socket');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.io shares the HTTP server; routes reach it through req.app.get('io')
const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/conversations', conversationRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is up and running!' });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});