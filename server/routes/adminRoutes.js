// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Item = require('../models/Item');

// Fetch pending student ID verifications
router.get('/users/pending', adminAuth, async (req, res) => {
    try {
        const pendingUsers = await User.find({ verificationStatus: 'pending' }).select('-password');
        res.json(pendingUsers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update student verification status
router.put('/users/:id/verify', adminAuth, async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: status },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get admin stats
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const lostItems = await Item.countDocuments({ type: 'lost', status: 'active' });
        const foundItems = await Item.countDocuments({ type: 'found', status: 'active' });
        const resolvedItems = await Item.countDocuments({ status: 'resolved' });
        res.json({ totalUsers, lostItems, foundItems, resolvedItems });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all items for moderation
router.get('/items', adminAuth, async (req, res) => {
    try {
        const items = await Item.find().populate('userId', 'name email');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all users for management
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete an item post
router.delete('/items/:id', adminAuth, async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete/Ban a user
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;