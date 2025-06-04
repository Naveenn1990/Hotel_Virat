const StoreLocation = require("../model/StoreLocation")
const mongoose = require("mongoose")

// Get all store locations
const getAllStoreLocations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query

    // Build query object
    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { manager: { $regex: search, $options: "i" } },
      ]
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true"
    }

    const options = {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      sort: { createdAt: -1 },
    }

    const locations = await StoreLocation.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)

    const total = await StoreLocation.countDocuments(query)

    res.status(200).json({
      success: true,
      data: locations,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalItems: total,
        itemsPerPage: options.limit,
      },
    })
  } catch (error) {
    console.error("Error fetching store locations:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching store locations",
      error: error.message,
    })
  }
}

// Get single store location by ID
const getStoreLocationById = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID",
      })
    }

    const location = await StoreLocation.findById(id)

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Store location not found",
      })
    }

    res.status(200).json({
      success: true,
      data: location,
    })
  } catch (error) {
    console.error("Error fetching store location:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching store location",
      error: error.message,
    })
  }
}

// Create new store location
const createStoreLocation = async (req, res) => {
  try {
    const { name, address, manager, contact } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      })
    }

    // Check if location with same name already exists
    const existingLocation = await StoreLocation.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      isActive: true,
    })

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: "A location with this name already exists",
      })
    }

const newLocation = new StoreLocation({
  name,
  address,
  manager,
  contact,
  createdBy: mongoose.Types.ObjectId("680b2580bc1de1a98574637a"),  // Use a valid ObjectId from your User collection
})

    const savedLocation = await newLocation.save()

    res.status(201).json({
      success: true,
      message: "Store location created successfully",
      data: savedLocation,
    })
  } catch (error) {
    console.error("Error creating store location:", error)

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      })
    }

    res.status(500).json({
      success: false,
      message: "Error creating store location",
      error: error.message,
    })
  }
}

// Update store location
const updateStoreLocation = async (req, res) => {
  try {
    const { id } = req.params
    const { name, address, manager, contact, isActive } = req.body
    const userId = req.user?.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID",
      })
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      })
    }

    // Check if location exists
    const existingLocation = await StoreLocation.findById(id)
    if (!existingLocation) {
      return res.status(404).json({
        success: false,
        message: "Store location not found",
      })
    }

    // Check if another location with same name exists (excluding current one)
    if (name && name !== existingLocation.name) {
      const duplicateLocation = await StoreLocation.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: id },
        isActive: true,
      })

      if (duplicateLocation) {
        return res.status(400).json({
          success: false,
          message: "A location with this name already exists",
        })
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(address && { address }),
      ...(manager && { manager }),
      ...(contact && { contact }),
      ...(isActive !== undefined && { isActive }),
      updatedBy: userId,
    }

    const updatedLocation = await StoreLocation.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    })

    res.status(200).json({
      success: true,
      message: "Store location updated successfully",
      data: updatedLocation,
    })
  } catch (error) {
    console.error("Error updating store location:", error)

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      })
    }

    res.status(500).json({
      success: false,
      message: "Error updating store location",
      error: error.message,
    })
  }
}

// Delete store location (soft delete)
const deleteStoreLocation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID",
      })
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      })
    }

    const location = await StoreLocation.findById(id)
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Store location not found",
      })
    }

    // Soft delete by setting isActive to false
    const deletedLocation = await StoreLocation.findByIdAndUpdate(
      id,
      {
        isActive: false,
        updatedBy: userId,
      },
      { new: true },
    )

    res.status(200).json({
      success: true,
      message: "Store location deleted successfully",
      data: deletedLocation,
    })
  } catch (error) {
    console.error("Error deleting store location:", error)
    res.status(500).json({
      success: false,
      message: "Error deleting store location",
      error: error.message,
    })
  }
}

// Permanently delete store location
const permanentDeleteStoreLocation = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID",
      })
    }

    const location = await StoreLocation.findById(id)
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Store location not found",
      })
    }

    await StoreLocation.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      message: "Store location permanently deleted",
    })
  } catch (error) {
    console.error("Error permanently deleting store location:", error)
    res.status(500).json({
      success: false,
      message: "Error permanently deleting store location",
      error: error.message,
    })
  }
}

// Update item count for a location
const updateItemCount = async (req, res) => {
  try {
    const { id } = req.params
    const { itemCount } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID",
      })
    }

    if (itemCount < 0) {
      return res.status(400).json({
        success: false,
        message: "Item count cannot be negative",
      })
    }

    const updatedLocation = await StoreLocation.findByIdAndUpdate(
      id, 
      { itemCount }, 
      { new: true, runValidators: true }
    )

    if (!updatedLocation) {
      return res.status(404).json({
        success: false,
        message: "Store location not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Item count updated successfully",
      data: updatedLocation,
    })
  } catch (error) {
    console.error("Error updating item count:", error)
    res.status(500).json({
      success: false,
      message: "Error updating item count",
      error: error.message,
    })
  }
}

module.exports = {
  getAllStoreLocations,
  getStoreLocationById,
  createStoreLocation,
  updateStoreLocation,
  deleteStoreLocation,
  permanentDeleteStoreLocation,
  updateItemCount,
}
