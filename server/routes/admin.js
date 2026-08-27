const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyAdmin } = require('../middleware/auth');

// GET /api/admin/pending-users
router.get('/pending-users', verifyAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ verificationStatus: 'pending' }).select('-password');
        res.status(200).json(pendingUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching pending users' });
    }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: status },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: `User status updated to ${status}`, user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating user status' });
    }
});

module.exports = router;