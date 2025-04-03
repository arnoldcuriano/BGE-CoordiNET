const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./user');
const adminRoutes = require('./admin');
const verifyRoutes = require('./verify');
const resetRoutes = require('./reset');

// Use separate route files
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/verify', verifyRoutes);
router.use('/reset', resetRoutes);

module.exports = router;
