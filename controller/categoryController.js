const Category = require('../model/Category');
const fs = require('fs');
const path = require('path');
const { uploadFile2, deleteFile } = require('../middleware/AWS');

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name,  branchId} = req.body;
    
    // Check if category with the same name already exists for this branch
    const existingCategory = await Category.findOne({ name, branchId });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists for this branch' });
    }

    const image = req.file ? await  uploadFile2(req.file,"category") : null;

    const category = new Category({
      name,
      branchId,
      image
    });

    await category.save();
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    res.status(400).json({ message: 'Error creating category', error: error.message });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { branchId } = req.query;
    
    // If branchId is provided, filter by branch
    const filter = branchId ? { branchId } : {};
    
    const categories = await Category.find(filter);
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Get a single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { name, branchId } = req.body;
    const updateData = { name,  branchId };

    // If a new image is uploaded, update the image path and delete the old image
    if (req.file) {
      updateData.image = req.file ? await uploadFile2(req.file, "category") : null;

      // Find the category to get the old image path
      const category = await Category.findById(req.params.id);
      if (category && category.image) {
      await deleteFile(category.image);
      }
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(400).json({ message: 'Error updating category', error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete the associated image file
    if (category.image) {
      await deleteFile(category.image);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};