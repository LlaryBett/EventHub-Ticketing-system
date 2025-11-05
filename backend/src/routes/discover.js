// routes/discover.js
const express = require('express');
const router = express.Router();
const discoverController = require('../controllers/discoverController');
const { protect, authorize } = require('../middleware/auth');

// Public route - get discover page data (only active items)
router.get('/', discoverController.getDiscoverData);

// Admin routes
router.get('/admin', protect, authorize('admin'), discoverController.getDiscoverDataForAdmin);
router.post('/', protect, authorize('admin'), discoverController.createDiscoverConfig);
router.put('/', protect, authorize('admin'), discoverController.updateDiscoverData);
router.patch('/:section', protect, authorize('admin'), discoverController.updateDiscoverSection);
router.delete('/', protect, authorize('admin'), discoverController.deactivateDiscoverConfig);
router.get('/history', protect, authorize('admin'), discoverController.getDiscoverHistory);

module.exports = router;