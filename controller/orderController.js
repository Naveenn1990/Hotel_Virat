const mongoose = require("mongoose"); // Add this import
const Order = require("../model/orderModel");
const Cart = require("../model/cartModel");
const User = require("../model/userModel");
const Branch = require("../model/Branch");

// Create a new order
exports.createOrder = async (req, res) => {
    try {
      const {
        userId,
        branchId,
        items,
        subtotal,
        discount,
        couponCode,
        deliveryFee,
        tax,
        total,
        deliveryOption,
        deliveryAddress,
        name,
        phone,
        paymentMethod,
        specialInstructions,
      } = req.body;
  
      // Validate required fields
      if (!userId || !branchId || !items || !subtotal || !total || !name || !phone) {
        return res.status(400).json({
          message: "Missing required fields",
          required: "userId, branchId, items, subtotal, total, name, phone",
        });
      }
  
      // Validate ObjectIds
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(branchId)
      ) {
        return res.status(400).json({ message: "Invalid User ID or Branch ID format" });
      }
  
      // Validate delivery address for delivery option
      if (deliveryOption === "delivery" && !deliveryAddress) {
        return res.status(400).json({ message: "Delivery address is required for delivery orders" });
      }
  
      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items must be a non-empty array" });
      }
  
      // Create initial delivery steps
      const deliverySteps = [
        {
          status: "Order Placed",
          time: new Date(),
          completed: true,
        },
      ];
  
      // Create the order
      const order = new Order({
        userId,
        branchId,
        items,
        subtotal,
        discount: discount || 0,
        couponCode,
        deliveryFee: deliveryFee || 0,
        tax: tax || 0,
        total,
        deliveryOption: deliveryOption || "delivery",
        deliveryAddress,
        name,
        phone,
        paymentMethod: paymentMethod || "cash",
        specialInstructions,
        deliverySteps,
      });
  
      // Save the order
      await order.save();
  
      // Log the query parameters for debugging
      console.log(`Searching for cart with userId: ${userId}, branchId: ${branchId}`);
  
      // Try to find and clear the cart
      let cart = await Cart.findOne({ userId, branchId });
      if (!cart) {
        console.log(`No cart found for userId: ${userId}, branchId: ${branchId}`);
        // Fallback: Try to find any cart for the user (temporary measure)
        cart = await Cart.findOne({ userId });
        if (cart) {
          console.log(`Found cart with different branchId: ${cart.branchId}, clearing it`);
          cart.items = [];
          await cart.save();
          return res.status(201).json({
            message: "Order created successfully, cleared cart with different branchId",
            order,
            orderNumber: order.orderNumber,
          });
        }
        return res.status(201).json({
          message: "Order created successfully, but no cart found to clear",
          order,
          orderNumber: order.orderNumber,
        });
      }
  
      // Clear cart items
      cart.items = [];
      await cart.save();
      console.log(`Cart cleared for userId: ${userId}, branchId: ${branchId}`);
  
      res.status(201).json({
        message: "Order created successfully, cart cleared",
        order,
        orderNumber: order.orderNumber,
      });
    } catch (error) {
      console.error("Error in createOrder:", error);
      res.status(500).json({ message: "Error creating order", error: error.message });
    }
  };
// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const orders = await Order.find({ userId }).populate("branchId", "name address").sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate("branchId", "name address").populate("userId", "name mobile");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error: error.message });
  }
};

// Get order by order number
exports.getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber })
      .populate("branchId", "name address")
      .populate("userId", "name mobile");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = ["pending", "confirmed", "preparing", "out for delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Add to delivery steps if status is changing
    if (order.status !== status) {
      order.deliverySteps.push({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        time: new Date(),
        completed: true,
      });
    }

    // If cancelling, require a reason
    if (status === "cancelled" && !req.body.cancellationReason) {
      return res.status(400).json({ message: "Cancellation reason is required" });
    }

    // Update order
    order.status = status;
    if (status === "cancelled") {
      order.cancellationReason = req.body.cancellationReason;
    }

    await order.save();

    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Error updating order status", error: error.message });
  }
};

// Get orders for a branch
exports.getBranchOrders = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { status } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }

    const query = { branchId };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query).populate("userId", "name mobile").sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching branch orders", error: error.message });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const { branchId } = req.query;

    const query = {};
    if (branchId) {
      query.branchId = branchId;
    }

    // Get counts by status
    const statusCounts = await Order.aggregate([{ $match: query }, { $group: { _id: "$status", count: { $sum: 1 } } }]);

    // Get total revenue
    const revenue = await Order.aggregate([
      { $match: { ...query, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      ...query,
      createdAt: { $gte: today },
    });

    // Format status counts into an object
    const statusMap = {};
    statusCounts.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    res.status(200).json({
      totalOrders: await Order.countDocuments(query),
      todayOrders,
      revenue: revenue.length > 0 ? revenue[0].total : 0,
      statusCounts: statusMap,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order statistics", error: error.message });
  }
};







// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      status,
      branchId,
      userId,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "", // Add search parameter
    } = req.query

    // Build the query object
    const query = {}

    if (status) {
      query.status = status
    }

    if (branchId) {
      if (!mongoose.Types.ObjectId.isValid(branchId)) {
        return res.status(400).json({ message: "Invalid Branch ID format" })
      }
      query.branchId = branchId
    }

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid User ID format" })
      }
      query.userId = userId
    }

    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {}
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate)
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate)
      }
    }

    // Add search functionality
    if (search && search.trim() !== "") {
      // Create a search regex for case-insensitive search
      const searchRegex = new RegExp(search.trim(), "i")

      // Search in multiple fields using $or operator
      query.$or = [{ orderNumber: searchRegex }, { name: searchRegex }, { phone: searchRegex }, { email: searchRegex }]
    }

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    // Execute query with pagination
    const orders = await Order.find(query)
      .populate("branchId", "name address")
      .populate("userId", "name email mobile")
      .sort(sortOptions)
      .limit(Number.parseInt(limit))
      .skip((Number.parseInt(page) - 1) * Number.parseInt(limit))

    // Get total count for pagination info
    const total = await Order.countDocuments(query)

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error in getAllOrders:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    })
  }
}
