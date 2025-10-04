const MealOfTheDay = require('../model/mealOfTheDayModel');
const mongoose = require('mongoose');
const { uploadFile2 } = require('../middleware/AWS');

// @desc    Create a new meal of the day
// @route   POST /api/v1/hotel/meal-of-the-day
// @access  Private/Admin
const createMealOfTheDay = async (req, res) => {
  try {
    console.log('=== Meal of the Day Creation Request ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    let {
      date,
      productId,
      branchId,
      title,
      description,
      specialPrice,
      availableQuantity,
      featured
    } = req.body;

    // Convert numeric fields
    specialPrice = parseFloat(specialPrice);
    availableQuantity = parseInt(availableQuantity);
    featured = featured === 'true' || featured === true;

    // Get product details to auto-populate meal data
    const Product = require('../model/menuModel');
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Auto-populate from product only for missing fields
    const autoOriginalPrice = product.price;
    const autoImage = product.image;
    
    console.log('Using provided title/description and product details:', {
      title,
      description,
      originalPrice: autoOriginalPrice,
      image: autoImage
    });

    // Check if MongoDB is connected after processing the data
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. State:', mongoose.connection.readyState);
      // Log the data for debugging purposes
      console.log('Request data that would have been saved:', {
        date, productId, branchId, title, description, 
        originalPrice, specialPrice, discount, imageUrl,
        availableQuantity, tags, allergens, featured
      });
      
      return res.status(200).json({
        success: false,
        message: 'Database not connected. Request logged for debugging. Please start MongoDB service.',
        debug: `Connection state: ${mongoose.connection.readyState}`,
        loggedData: { date, title, originalPrice, specialPrice, imageUrl }
      });
    }

    // Validate required fields
    if (!date || !productId || !branchId || !title || !description || !specialPrice || !availableQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: date, productId, branchId, title, description, specialPrice, availableQuantity'
      });
    }

    // Check if meal already exists for this date and branch
    try {
      const existingMeal = await MealOfTheDay.findOne({
        date: new Date(date),
        branchId: branchId
      });

      if (existingMeal) {
        return res.status(400).json({
          success: false,
          message: 'Meal of the day already exists for this date and branch'
        });
      }
    } catch (dbError) {
      console.error('Database check error:', dbError);
      // Continue without duplicate check if DB is having issues
      console.log('Skipping duplicate check due to DB timeout');
    }

    // Calculate discount based on product price and special price
    // Ensure discount is never negative (if special price > original price, set discount to 0)
    let calculatedDiscount = Math.round(((autoOriginalPrice - specialPrice) / autoOriginalPrice) * 100);
    if (calculatedDiscount < 0) {
      calculatedDiscount = 0; // No discount if special price is higher than original
    }
    
    console.log('Discount calculation:', {
      originalPrice: autoOriginalPrice,
      specialPrice: specialPrice,
      calculatedDiscount: calculatedDiscount
    });

    const mealOfTheDay = new MealOfTheDay({
      date: new Date(date),
      productId,
      branchId,
      title: title, // Use provided title
      description: description, // Use provided description
      originalPrice: autoOriginalPrice,
      specialPrice,
      discount: calculatedDiscount,
      image: autoImage, // Use product's image
      availableQuantity,
      tags: [], // Empty array - no custom tags
      preparationTime: null, // No custom preparation time
      nutritionalInfo: {}, // Empty object - no custom nutritional info
      allergens: [], // Empty array - no custom allergens
      featured: featured || false,
      adminNotes: '' // No admin notes
    });

    try {
      await mealOfTheDay.save();

      // Populate the response
      await mealOfTheDay.populate('productId', 'name price image');
      await mealOfTheDay.populate('branchId', 'name address');
    } catch (saveError) {
      console.error('Database save error:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Database connection issue. Please check MongoDB connection.',
        error: saveError.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Meal of the day created successfully',
      data: mealOfTheDay
    });

  } catch (error) {
    console.error('Error creating meal of the day:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all meals of the day
// @route   GET /api/v1/hotel/meal-of-the-day
// @access  Public
const getAllMealsOfTheDay = async (req, res) => {
  try {
    const { branchId, date, isActive } = req.query;
    
    console.log('getAllMealsOfTheDay called with:', { branchId, date, isActive });
    
    let query = {};
    
    if (branchId) {
      query.branchId = branchId;
    }
    
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    console.log('Query:', query);

    const meals = await MealOfTheDay.find(query)
      .populate('productId', 'name price image description')
      .populate('branchId', 'name address')
      .sort({ date: -1, featured: -1 });

    console.log('Found meals:', meals.length);

    res.status(200).json({
      success: true,
      count: meals.length,
      data: meals
    });

  } catch (error) {
    console.error('Error fetching meals of the day:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get meal of the day by ID
// @route   GET /api/v1/hotel/meal-of-the-day/:id
// @access  Public
const getMealOfTheDayById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal of the day ID'
      });
    }

    const meal = await MealOfTheDay.findById(id)
      .populate('productId', 'name price image description')
      .populate('branchId', 'name address');

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal of the day not found'
      });
    }

    res.status(200).json({
      success: true,
      data: meal
    });

  } catch (error) {
    console.error('Error fetching meal of the day:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update meal of the day
// @route   PUT /api/v1/hotel/meal-of-the-day/:id
// @access  Private/Admin
const updateMealOfTheDay = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = req.body;

    // Parse JSON strings from FormData
    try {
      if (typeof updateData.tags === 'string') updateData.tags = JSON.parse(updateData.tags);
      if (typeof updateData.allergens === 'string') updateData.allergens = JSON.parse(updateData.allergens);
      if (typeof updateData.nutritionalInfo === 'string') updateData.nutritionalInfo = JSON.parse(updateData.nutritionalInfo);
      
      // Convert numeric fields
      if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
      if (updateData.specialPrice) updateData.specialPrice = parseFloat(updateData.specialPrice);
      if (updateData.discount) updateData.discount = parseFloat(updateData.discount);
      if (updateData.availableQuantity) updateData.availableQuantity = parseInt(updateData.availableQuantity);
      if (updateData.preparationTime) updateData.preparationTime = parseInt(updateData.preparationTime);
      if (updateData.featured !== undefined) updateData.featured = updateData.featured === 'true' || updateData.featured === true;
    } catch (error) {
      console.error('Error parsing FormData fields:', error);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal of the day ID'
      });
    }

    // Handle image upload if provided
    if (req.file) {
      try {
        const imageUrl = await uploadFile2(req.file, 'meal-of-the-day');
        updateData.image = imageUrl;
        console.log('New image uploaded successfully:', imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Recalculate discount if prices are updated
    if (updateData.originalPrice && updateData.specialPrice) {
      updateData.discount = Math.round(((updateData.originalPrice - updateData.specialPrice) / updateData.originalPrice) * 100);
    }

    const meal = await MealOfTheDay.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('productId', 'name price image description')
      .populate('branchId', 'name address');

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal of the day not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meal of the day updated successfully',
      data: meal
    });

  } catch (error) {
    console.error('Error updating meal of the day:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Delete meal of the day
// @route   DELETE /api/v1/hotel/meal-of-the-day/:id
// @access  Private/Admin
const deleteMealOfTheDay = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal of the day ID'
      });
    }

    const meal = await MealOfTheDay.findByIdAndDelete(id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal of the day not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meal of the day deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meal of the day:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get today's meal of the day
// @route   GET /api/v1/hotel/meal-of-the-day/today/:branchId
// @access  Public
const getTodaysMeal = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todaysMeal = await MealOfTheDay.findOne({
      branchId: branchId,
      date: { $gte: startOfDay, $lte: endOfDay },
      isActive: true
    })
      .populate('productId', 'name price image description')
      .populate('branchId', 'name address');

    if (!todaysMeal) {
      return res.status(404).json({
        success: false,
        message: 'No meal of the day found for today'
      });
    }

    res.status(200).json({
      success: true,
      data: todaysMeal
    });

  } catch (error) {
    console.error('Error fetching today\'s meal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createMealOfTheDay,
  getAllMealsOfTheDay,
  getMealOfTheDayById,
  updateMealOfTheDay,
  deleteMealOfTheDay,
  getTodaysMeal
};

