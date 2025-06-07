const StoreLocation = require("../model/storeLocationModel");

// Create a new store location
exports.createStoreLocation = async (req, res) => {
    try {
        const { name, address, manager, contact, itemCount } = req.body;
        const location = new StoreLocation({ name, address, manager, contact, itemCount });
        await location.save();
        res.status(201).json({
            success: true,
            message: "Store location created successfully",
            data: location,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create store location", error: error.message });
    }
};

// Get all store locations
exports.getAllStoreLocations = async (req, res) => {
    try {
        const locations = await StoreLocation.find();
        res.status(200).json({ success: true, data: locations });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch store locations", error: error.message });
    }
};

// Get a single store location by ID
exports.getStoreLocationById = async (req, res) => {
    try {
        const location = await StoreLocation.findById(req.params.id);
        if (!location) {
            return res.status(404).json({ success: false, message: "Store location not found" });
        }
        res.status(200).json({ success: true, data: location });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch store location", error: error.message });
    }
};

// Update a store location
exports.updateStoreLocation = async (req, res) => {
    try {
        const { name, address, manager, contact, itemCount } = req.body;
        const location = await StoreLocation.findByIdAndUpdate(
            req.params.id,
            { name, address, manager, contact, itemCount },
            { new: true }
        );
        if (!location) {
            return res.status(404).json({ success: false, message: "Store location not found" });
        }
        res.status(200).json({
            success: true,
            message: "Store location updated successfully",
            data: location,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update store location", error: error.message });
    }
};

// Delete a store location
exports.deleteStoreLocation = async (req, res) => {
    try {
        const location = await StoreLocation.findByIdAndDelete(req.params.id);
        if (!location) {
            return res.status(404).json({ success: false, message: "Store location not found" });
        }
        res.status(200).json({ success: true, message: "Store location deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete store location", error: error.message });
    }
};