const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is up and running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));