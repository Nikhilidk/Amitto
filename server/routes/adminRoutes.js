const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const Item = require('../models/Item');
const User = require('../models/User');

// 1. Overview Metrics Endpoint
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const lostItems = await Item.countDocuments({ type: 'lost' });
    const foundItems = await Item.countDocuments({ type: 'found' });
    const resolvedItems = await Item.countDocuments({ status: 'resolved' });

    res.json({ totalUsers, lostItems, foundItems, resolvedItems });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Fetch All Items for Moderation
router.get('/items', adminAuth, async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Delete/Remove Inappropriate Item Post
router.delete('/items/:id', adminAuth, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully by admin.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Fetch All Users for Account Management
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Delete or Ban a User Account
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User account removed by admin.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;