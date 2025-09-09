const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validation');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected admin routes
router.post(
  '/',
  protect,
  authorize('admin'),
  validateCategory,
  categoryController.createCategory
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  validateCategory,
  categoryController.updateCategory
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  categoryController.deleteCategory
);

// Dashboard stats
router.get(
  '/stats/overview',
  protect,
  authorize('admin'),
  categoryController.getCategoryStats
);

module.exports = router;
