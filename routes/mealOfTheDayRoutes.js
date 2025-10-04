const express = require('express');
const router = express.Router();
const mealOfTheDayController = require('../controller/mealOfTheDayController');
const multer = require('../middleware/multerConfig');
const { uploadFile2 } = require('../middleware/AWS');

// @route   POST /api/v1/hotel/meal-of-the-day
// @desc    Create a new meal of the day
// @access  Private/Admin
router.post('/', multer.single('image'), mealOfTheDayController.createMealOfTheDay);

// @route   GET /api/v1/hotel/meal-of-the-day
// @desc    Get all meals of the day
// @access  Public
router.get('/', mealOfTheDayController.getAllMealsOfTheDay);

// @route   GET /api/v1/hotel/meal-of-the-day/today/:branchId
// @desc    Get today's meal of the day for a specific branch
// @access  Public
router.get('/today/:branchId', mealOfTheDayController.getTodaysMeal);

// @route   GET /api/v1/hotel/meal-of-the-day/:id
// @desc    Get meal of the day by ID
// @access  Public
router.get('/:id', mealOfTheDayController.getMealOfTheDayById);

// @route   PUT /api/v1/hotel/meal-of-the-day/:id
// @desc    Update meal of the day
// @access  Private/Admin
router.put('/:id', multer.single('image'), mealOfTheDayController.updateMealOfTheDay);

// @route   DELETE /api/v1/hotel/meal-of-the-day/:id
// @desc    Delete meal of the day
// @access  Private/Admin
router.delete('/:id', mealOfTheDayController.deleteMealOfTheDay);

module.exports = router;

