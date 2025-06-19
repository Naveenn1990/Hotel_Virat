// controllers/inventoryItemController.js
const InventoryItem = require('../model/inventoryItemSchema');
const mongoose = require('mongoose');

// @desc    Create new inventory item
// @route   POST /procurement/inventory
// @access  Private
exports.createInventoryItem = async (req, res) => {
  try {
    const newItem = new InventoryItem(req.body);
    const savedItem = await newItem.save();
    
    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: savedItem
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory item',
      error: error.message
    });
  }
};

// @desc    Get all inventory items
// @route   GET /procurement/inventory
// @access  Private
exports.getAllInventoryItems = async (req, res) => {
  try {
    const { search, category, status, sort } = req.query;
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Sorting
    const sortOptions = {};
    if (sort) {
      const sortFields = sort.split(',');
      sortFields.forEach(field => {
        const [key, order] = field.split(':');
        sortOptions[key] = order === 'desc' ? -1 : 1;
      });
    } else {
      sortOptions.itemName = 1; // Default sort by name ascending
    }
    
    const items = await InventoryItem.find(query)
      .sort(sortOptions)
      .populate('supplier', 'name contactPerson phone')
      .lean();
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory items',
      error: error.message
    });
  }
};

// @desc    Get single inventory item
// @route   GET /procurement/inventory/:id
// @access  Private
exports.getInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id)
      .populate('supplier', 'name contactPerson phone email')
      .populate('projectAllocations.projectId', 'projectName')
      .lean();
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory item',
      error: error.message
    });
  }
};

// @desc    Update inventory item
// @route   PUT /procurement/inventory/:id
// @access  Private
exports.updateInventoryItem = async (req, res) => {
  try {
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message
    });
  }
};

// @desc    Delete inventory item
// @route   DELETE /procurement/inventory/:id
// @access  Private
exports.deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message
    });
  }
};

// @desc    Get low stock items
// @route   GET /procurement/inventory/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
  try {
    const items = await InventoryItem.aggregate([
      {
        $addFields: {
          isLowStock: { $lte: ['$stock', '$minRequired'] }
        }
      },
      { $match: { isLowStock: true } },
      { $sort: { stock: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items',
      error: error.message
    });
  }
};

// @desc    Record stock movement
// @route   POST /procurement/inventory/:id/movement
// @access  Private
exports.recordStockMovement = async (req, res) => {
  try {
    const { type, quantity, reason, department } = req.body;
    const itemId = req.params.id;
    
    // Validate input
    if (!['in', 'out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movement type. Must be "in" or "out"'
      });
    }
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }
    
    // Find item
    const item = await InventoryItem.findById(itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Check stock if it's an out movement
    if (type === 'out' && item.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${item.stock}`
      });
    }
    
    // Update stock
    const newStock = type === 'in' 
      ? item.stock + parseInt(quantity)
      : item.stock - parseInt(quantity);
    
    // Update item
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      itemId,
      { stock: newStock },
      { new: true, runValidators: true }
    );
    
    // Create movement record (you might want to save this to a separate collection)
    const movementRecord = {
      item: itemId,
      type,
      quantity,
      reason,
      department: department || 'Direct Entry',
      date: new Date(),
      previousStock: item.stock,
      newStock
    };
    
    // In a real application, you would save this to a StockMovement collection
    // await StockMovement.create(movementRecord);
    
    res.status(200).json({
      success: true,
      message: `Stock ${type === 'in' ? 'added' : 'deducted'} successfully`,
      data: {
        updatedItem,
        movementRecord
      }
    });
  } catch (error) {
    console.error('Error recording stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record stock movement',
      error: error.message
    });
  }
};

// @desc    Allocate items to project
// @route   POST /procurement/inventory/:id/allocate
// @access  Private
exports.allocateToProject = async (req, res) => {
  try {
    const { projectId, quantity } = req.body;
    const itemId = req.params.id;
    
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }
    
    // Find item
    const item = await InventoryItem.findById(itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Check available stock
    const allocatedQuantity = item.projectAllocations.reduce(
      (sum, alloc) => sum + alloc.allocatedQuantity, 0
    );
    const availableStock = item.stock - allocatedQuantity;
    
    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available stock. Available: ${availableStock}`
      });
    }
    
    // Add allocation
    const newAllocation = {
      projectId,
      allocatedQuantity: parseInt(quantity),
      allocationDate: new Date()
    };
    
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      itemId,
      { $push: { projectAllocations: newAllocation } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Items allocated to project successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error allocating items to project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate items to project',
      error: error.message
    });
  }
};

// @desc    Get inventory valuation report
// @route   GET /procurement/inventory/reports/valuation
// @access  Private
exports.getInventoryValuation = async (req, res) => {
  try {
    const items = await InventoryItem.find().lean();
    
    const totalValue = items.reduce((sum, item) => sum + (item.stock * item.unitPrice), 0);
    
    const report = {
      generatedDate: new Date(),
      totalItems: items.length,
      totalStockValue: totalValue,
      items: items.map(item => ({
        itemName: item.itemName,
        category: item.category,
        stock: item.stock,
        unitPrice: item.unitPrice,
        totalValue: item.stock * item.unitPrice
      }))
    };
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating valuation report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory valuation report',
      error: error.message
    });
  }
};