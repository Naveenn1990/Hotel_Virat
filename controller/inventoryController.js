const { LocationInventory, StockTransaction } = require("../model/inventoryModel")
const RawMaterial = require("../model/rawMaterialModel")
const StoreLocation = require("../model/storeLocationModel")
const mongoose = require("mongoose")
const Recipe = require("../model/recipe") // Ensure Recipe model is imported

// Get inventory for a specific location
exports.getLocationInventory = async (req, res) => {
  try {
    const { locationId } = req.params
    const { search, category, status } = req.query

    // Validate locationId
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid location ID format" 
      })
    }

    // Check if location exists
    const location = await StoreLocation.findById(locationId)
    if (!location) {
      return res.status(404).json({ 
        success: false, 
        error: "Store location not found" 
      })
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: { locationId: new mongoose.Types.ObjectId(locationId) },
      },
      {
        $lookup: {
          from: "rawmaterials",
          localField: "rawMaterialId",
          foreignField: "_id",
          as: "material",
        },
      },
      {
        $unwind: "$material",
      },
    ]

    // Add search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "material.name": { $regex: search, $options: "i" } },
            { "material.description": { $regex: search, $options: "i" } },
          ],
        },
      })
    }

    // Add category filter
    if (category && category !== "all") {
      pipeline.push({
        $match: { "material.category": category },
      })
    }

    // Add status calculation and filter
    pipeline.push({
      $addFields: {
        status: {
          $cond: {
            if: { $eq: ["$quantity", 0] },
            then: "Out of Stock",
            else: {
              $cond: {
                if: { $lte: ["$quantity", "$material.minLevel"] },
                then: "Low Stock",
                else: "In Stock",
              },
            },
          },
        },
      },
    })

    if (status && status !== "all") {
      pipeline.push({
        $match: { status: status },
      })
    }

    const inventory = await LocationInventory.aggregate(pipeline)

    res.json({
      success: true,
      data: inventory.map((item) => ({
        _id: item._id,
        name: item.material.name,
        category: item.material.category,
        unit: item.material.unit,
        quantity: item.quantity,
        costPrice: item.costPrice,
        price: item.material.price,
        minLevel: item.material.minLevel,
        status: item.status,
        expiryDate: item.expiryDate,
        batchNumber: item.batchNumber,
        description: item.material.description,
        supplier: item.material.supplier,
        lastUpdated: item.lastUpdated,
      })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Add raw material to location inventory
exports.addToLocationInventory = async (req, res) => {
  try {
    const { locationId } = req.params
    const { rawMaterialId, quantity, costPrice, expiryDate, batchNumber } = req.body

    // Validate location and raw material exist
    const location = await StoreLocation.findById(locationId)
    if (!location) {
      return res.status(404).json({ error: "Store location not found" })
    }

    const rawMaterial = await RawMaterial.findById(rawMaterialId)
    if (!rawMaterial) {
      return res.status(404).json({ error: "Raw material not found" })
    }

    // Check if inventory item already exists
    let inventoryItem = await LocationInventory.findOne({
      locationId,
      rawMaterialId,
    })

    if (inventoryItem) {
      // Update existing inventory
      inventoryItem.quantity += Number.parseFloat(quantity)
      inventoryItem.costPrice = costPrice || inventoryItem.costPrice
      if (expiryDate) inventoryItem.expiryDate = expiryDate
      if (batchNumber) inventoryItem.batchNumber = batchNumber
      inventoryItem.lastUpdated = new Date()
      await inventoryItem.save()
    } else {
      // Create new inventory item
      inventoryItem = new LocationInventory({
        locationId,
        rawMaterialId,
        quantity: Number.parseFloat(quantity),
        costPrice: costPrice || rawMaterial.price,
        expiryDate,
        batchNumber,
      })
      await inventoryItem.save()
    }

    // Create stock transaction record
    const transaction = new StockTransaction({
      type: "inward",
      locationId,
      rawMaterialId,
      quantity: Number.parseFloat(quantity),
      costPrice: costPrice || rawMaterial.price,
      reference: `INV-${Date.now()}`,
      source: "Manual Entry",
      expiryDate,
      batchNumber,
      userId: req.user?.id,
    })
    await transaction.save()

    // Update main raw material stock
    rawMaterial.quantity += Number.parseFloat(quantity)
    await rawMaterial.save()

    res.json({
      success: true,
      message: "Raw material added to inventory successfully",
      data: inventoryItem,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Deduct stock from location inventory
exports.deductFromLocationInventory = async (req, res) => {
  try {
    const { locationId } = req.params
    const { rawMaterialId, quantity, reference, destination } = req.body

    const inventoryItem = await LocationInventory.findOne({
      locationId,
      rawMaterialId,
    })

    if (!inventoryItem) {
      return res.status(404).json({ error: "Item not found in location inventory" })
    }

    if (inventoryItem.quantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock" })
    }

    // Deduct from location inventory
    inventoryItem.quantity -= Number.parseFloat(quantity)
    inventoryItem.lastUpdated = new Date()
    await inventoryItem.save()

    // Create stock transaction record
    const transaction = new StockTransaction({
      type: "outward",
      locationId,
      rawMaterialId,
      quantity: Number.parseFloat(quantity),
      costPrice: inventoryItem.costPrice,
      reference: reference || `OUT-${Date.now()}`,
      destination: destination || "Recipe Usage",
      userId: req.user?.id,
    })
    await transaction.save()

    // Update main raw material stock
    const rawMaterial = await RawMaterial.findById(rawMaterialId)
    if (rawMaterial) {
      rawMaterial.quantity = Math.max(0, rawMaterial.quantity - Number.parseFloat(quantity))
      await rawMaterial.save()
    }

    res.json({
      success: true,
      message: "Stock deducted successfully",
      data: inventoryItem,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get stock transactions
exports.getStockTransactions = async (req, res) => {
  try {
    const { type, locationId, startDate, endDate } = req.query

    const filter = {}
    if (type && type !== "all") filter.type = type
    if (locationId) filter.locationId = locationId
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const transactions = await StockTransaction.find(filter)
      .populate("locationId", "name")
      .populate("rawMaterialId", "name unit")
      .sort({ createdAt: -1 })
      .limit(100)

    res.json({
      success: true,
      data: transactions,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Deduct stock based on recipe
exports.deductStockByRecipe = async (req, res) => {
  try {
    const { recipeId, locationId, quantity } = req.body

    // Get recipe details
    const recipe = await Recipe.findById(recipeId).populate("ingredients.rawMaterialId", "name unit price minLevel")
    if (!recipe) {
      return res.status(404).json({ success: false, error: "Recipe not found" })
    }

    // Check if location exists
    const location = await StoreLocation.findById(locationId)
    if (!location) {
      return res.status(404).json({ success: false, error: "Location not found" })
    }

    // Check stock availability for all ingredients
    const insufficientStock = []
    const lowStockWarnings = []

    for (const ingredient of recipe.ingredients) {
      const inventoryItem = await LocationInventory.findOne({
        locationId,
        rawMaterialId: ingredient.rawMaterialId._id,
      })

      const requiredQuantity = ingredient.quantity * quantity

      if (!inventoryItem || inventoryItem.quantity < requiredQuantity) {
        insufficientStock.push({
          material: ingredient.rawMaterialId.name,
          required: requiredQuantity,
          available: inventoryItem ? inventoryItem.quantity : 0,
          unit: ingredient.unit || ingredient.rawMaterialId.unit,
        })
      } else if (inventoryItem.quantity - requiredQuantity < ingredient.rawMaterialId.minLevel) {
        lowStockWarnings.push({
          material: ingredient.rawMaterialId.name,
          currentStock: inventoryItem.quantity,
          afterDeduction: inventoryItem.quantity - requiredQuantity,
          minLevel: ingredient.rawMaterialId.minLevel,
          unit: ingredient.unit || ingredient.rawMaterialId.unit,
        })
      }
    }

    // If there's insufficient stock, return error
    if (insufficientStock.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Insufficient stock for some ingredients",
        insufficientItems: insufficientStock,
      })
    }

    // Deduct stock for each ingredient
    const deductions = []
    const reference = `RECIPE-${recipe.name}-${Date.now()}`

    for (const ingredient of recipe.ingredients) {
      const requiredQuantity = ingredient.quantity * quantity

      const inventoryItem = await LocationInventory.findOne({
        locationId,
        rawMaterialId: ingredient.rawMaterialId._id,
      })

      // Deduct from location inventory
      inventoryItem.quantity -= requiredQuantity
      inventoryItem.lastUpdated = new Date()
      await inventoryItem.save()

      // Create stock transaction record
      const transaction = new StockTransaction({
        type: "outward",
        locationId,
        rawMaterialId: ingredient.rawMaterialId._id,
        quantity: requiredQuantity,
        costPrice: inventoryItem.costPrice,
        reference,
        destination: `Recipe: ${recipe.name}`,
        userId: req.user?.id,
      })
      await transaction.save()

      deductions.push({
        material: ingredient.rawMaterialId.name,
        deducted: requiredQuantity,
        unit: ingredient.unit || ingredient.rawMaterialId.unit,
      })
    }

    res.json({
      success: true,
      message: "Stock deducted successfully for recipe",
      deductions,
      lowStockWarnings: lowStockWarnings.length > 0 ? lowStockWarnings : null,
    })
  } catch (err) {
    console.error("Error deducting stock by recipe:", err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Get low stock alerts
exports.getLowStockAlerts = async (req, res) => {
  try {
    const { locationId } = req.query

    const pipeline = [
      {
        $lookup: {
          from: "rawmaterials",
          localField: "rawMaterialId",
          foreignField: "_id",
          as: "material",
        },
      },
      {
        $unwind: "$material",
      },
      {
        $match: {
          $expr: { $lte: ["$quantity", "$material.minLevel"] },
        },
      },
    ]

    if (locationId) {
      pipeline.unshift({
        $match: { locationId: new mongoose.Types.ObjectId(locationId) },
      })
    }

    const lowStockItems = await LocationInventory.aggregate(pipeline)

    res.json({
      success: true,
      data: lowStockItems,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get expiring items
exports.getExpiringItems = async (req, res) => {
  try {
    const { locationId, days = 7 } = req.query
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + Number.parseInt(days))

    const filter = {
      expiryDate: { $lte: expiryDate, $gte: new Date() },
      quantity: { $gt: 0 },
    }

    if (locationId) {
      filter.locationId = locationId
    }

    const expiringItems = await LocationInventory.find(filter)
      .populate("locationId", "name")
      .populate("rawMaterialId", "name unit")
      .sort({ expiryDate: 1 })

    res.json({
      success: true,
      data: expiringItems,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
