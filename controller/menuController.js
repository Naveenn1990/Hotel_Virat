const Menu = require('../model/menuModel');
const fs = require('fs');
const path = require('path');
const { uploadFile2, deleteFile } = require('../middleware/AWS');

// Create a new menu item
exports.createMenuItem = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      categoryId, 
      branchId,
      subscriptionEnabled,
      subscriptionPlans
    } = req.body;

    // Parse subscriptionPlans if it's a JSON string
    let parsedSubscriptionPlans = subscriptionPlans;
    if (typeof subscriptionPlans === 'string') {
      try {
        parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
      } catch (error) {
        console.error('Error parsing subscriptionPlans:', error);
        parsedSubscriptionPlans = [];
      }
    }

    const image = req.file ? await uploadFile2(req.file, 'menu') : null;

    const menuItem = new Menu({
      name,
      description,
      price,
      categoryId,
      branchId,
      image,
      subscriptionEnabled: subscriptionEnabled || false,
      subscriptionPlans: parsedSubscriptionPlans || []
    });

    await menuItem.save();
    res.status(201).json({ message: 'Menu item created successfully', menuItem });
  } catch (error) {
    res.status(400).json({ message: 'Error creating menu item', error: error.message });
  }
};

// Get all menu items
exports.getAllMenuItems = async (req, res) => {
  try {
    const { categoryId, branchId } = req.query;
    
    // Build filter based on query parameters
    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (branchId) filter.branchId = branchId;
    
    const menuItems = await Menu.find(filter)
      .populate('categoryId', 'name')
      .populate('branchId', 'name')
      .select('name description price image categoryId branchId stock lowStockAlert isActive subscriptionEnabled subscriptionPlans')
      .sort({ name: 1 });
      
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
};

// Get a single menu item by ID
exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('branchId', 'name')
      .select('name description price image categoryId branchId stock lowStockAlert isActive subscriptionEnabled subscriptionPlans');
      
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu item', error: error.message });
  }
};

// Update a menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      categoryId, 
      branchId,
      subscriptionEnabled,
      subscriptionPlans
    } = req.body;

    // Parse subscriptionPlans if it's a JSON string
    let parsedSubscriptionPlans = subscriptionPlans;
    if (typeof subscriptionPlans === 'string') {
      try {
        parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
      } catch (error) {
        console.error('Error parsing subscriptionPlans:', error);
        parsedSubscriptionPlans = [];
      }
    }
    
    const updateData = { 
      name, 
      description, 
      price, 
      categoryId, 
      branchId,
      subscriptionEnabled,
      subscriptionPlans: parsedSubscriptionPlans
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // If a new image is uploaded, update the image path and delete the old image
    if (req.file) {
      updateData.image = await uploadFile2(req.file, 'menu');

      // Find the menu item to get the old image path
      const menuItem = await Menu.findById(req.params.id);
      if (menuItem && menuItem.image) {
       deleteFile(menuItem.image);
      }
    }

    const menuItem = await Menu.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item updated successfully', menuItem });
  } catch (error) {
    res.status(400).json({ message: 'Error updating menu item', error: error.message });
  }
};

// Delete a menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Delete the associated image file
    if (menuItem.image) {
      deleteFile(menuItem.image);
    }

    await Menu.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item', error: error.message });
  }
};

// Get menu items by category
exports.getMenuItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const menuItems = await Menu.find({ 
      categoryId
    }).sort({ name: 1 });
    
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
};