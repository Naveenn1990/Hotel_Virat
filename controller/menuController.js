const Menu = require('../model/menuModel');
const fs = require('fs');
const path = require('path');

// Create a new menu item
exports.createMenuItem = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      categoryId, 
      branchId
    } = req.body;
    
    const image = req.file ? req.file.path : null;

    const menuItem = new Menu({
      name,
      description,
      price,
      categoryId,
      branchId,
      image
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
      .populate('categoryId', 'name');
      
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
      branchId
    } = req.body;
    
    const updateData = { 
      name, 
      description, 
      price, 
      categoryId, 
      branchId
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // If a new image is uploaded, update the image path and delete the old image
    if (req.file) {
      updateData.image = req.file.path;

      // Find the menu item to get the old image path
      const menuItem = await Menu.findById(req.params.id);
      if (menuItem && menuItem.image) {
        fs.unlink(path.join(__dirname, '..', menuItem.image), (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
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
      fs.unlink(path.join(__dirname, '..', menuItem.image), (err) => {
        if (err) console.error('Error deleting image:', err);
      });
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