const StaffOrder = require("../model/staffOrderModel")
const StaffLogin = require("../model/staffLoginModel")
const mongoose = require("mongoose")

// Create a new staff order after payment success
exports.createStaffOrderAfterPayment = async (req, res) => {
  try {
    const {
      userId, // Add userId to destructuring
      restaurant,
      table,
      peopleCount,
      cart,
      totalAmount,
      orderId,
      orderTime,
      grandTotal,
      paymentMethod,
      notes,
      branchId,
      tableId,
    } = req.body

    console.log("Received order creation request with userId:", userId)

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      })
    }

    // Verify user exists
    const user = await StaffLogin.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Validate required fields
    if (!restaurant || !restaurant.name) {
      return res.status(400).json({
        success: false,
        message: "Restaurant/Branch information is required",
      })
    }

    if (!table || !table.number) {
      return res.status(400).json({
        success: false,
        message: "Table information is required",
      })
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      })
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      })
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      })
    }

    // Check if order already exists
    const existingOrder = await StaffOrder.findOne({ orderId })
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already exists",
        order: existingOrder,
      })
    }

    // Process cart items
    const orderItems = cart.map((item) => ({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || "",
      description: item.description || "",
    }))

    // Calculate totals
    const subtotal = totalAmount
    const tax = subtotal * 0.05 // 5% tax
    const serviceCharge = subtotal * 0.1 // 10% service charge
    const calculatedGrandTotal = subtotal + tax + serviceCharge

    // Prepare order data
    const orderData = {
      userId, // Include userId in order data
      orderId,
      branchName: restaurant.name,
      tableNumber: table.number.toString(),
      peopleCount,
      items: orderItems,
      subtotal,
      tax,
      serviceCharge,
      totalAmount: subtotal,
      grandTotal: grandTotal || calculatedGrandTotal,
      paymentStatus: "completed",
      paymentMethod,
      orderTime: new Date(orderTime),
      notes: notes || "",
      status: "pending",
    }

    // Add IDs if provided by frontend
    if (branchId) {
      orderData.branchId = branchId
    } else {
      orderData.branchId = new mongoose.Types.ObjectId()
    }

    if (tableId) {
      orderData.tableId = tableId
    } else {
      orderData.tableId = new mongoose.Types.ObjectId()
    }

    // Create the staff order
    const staffOrder = new StaffOrder(orderData)
    await staffOrder.save()

    console.log("Order created successfully for user:", userId, "Order ID:", staffOrder.orderId)

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: staffOrder,
    })
  } catch (error) {
    console.error("Error creating staff order after payment:", error)
    res.status(500).json({
      success: false,
      message: "Error creating order after payment",
      error: error.message,
    })
  }
}

// Get orders by userId - NEW FUNCTION
exports.getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params

    console.log("Fetching orders for userId:", userId)

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      })
    }

    // Verify user exists
    const user = await StaffLogin.findById(userId)
    if (!user) {
      console.log("User not found for userId:", userId)
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    console.log("User found:", user.name)

    const orders = await StaffOrder.find({ userId })
      .populate("branchId", "name address")
      .populate("tableId", "number capacity")
      .populate("userId", "name mobile") // Populate user details
      .sort({ createdAt: -1 })

    console.log("Found orders:", orders.length)

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      user: {
        name: user.name,
        mobile: user.mobile,
      },
    })
  } catch (error) {
    console.error("Error fetching user orders:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    })
  }
}

// Get all staff orders (existing function)
exports.getAllStaffOrders = async (req, res) => {
  try {
    const { branchId, branchName, tableId, tableNumber, status, paymentStatus, userId, search } = req.query

    // Build filter based on query parameters
    const filter = {}
    if (branchId) filter.branchId = branchId
    if (branchName) filter.branchName = new RegExp(branchName, "i")
    if (tableId) filter.tableId = tableId
    if (tableNumber) filter.tableNumber = tableNumber
    if (status) filter.status = status
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (userId) filter.userId = userId

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, "i")
      filter.$or = [{ orderId: searchRegex }, { tableNumber: searchRegex }, { branchName: searchRegex }]
    }

    const staffOrders = await StaffOrder.find(filter)
      .populate("branchId", "name address")
      .populate("tableId", "number capacity")
      .populate("userId", "name mobile")
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: staffOrders.length,
      orders: staffOrders,
    })
  } catch (error) {
    console.error("Error fetching staff orders:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching staff orders",
      error: error.message,
    })
  }
}

// Get a staff order by ID
exports.getStaffOrderById = async (req, res) => {
  try {
    const staffOrder = await StaffOrder.findById(req.params.id)
      .populate("branchId", "name address")
      .populate("tableId", "number capacity")
      .populate("userId", "name mobile")

    if (!staffOrder) {
      return res.status(404).json({
        success: false,
        message: "Staff order not found",
      })
    }
    res.status(200).json({
      success: true,
      order: staffOrder,
    })
  } catch (error) {
    console.error("Error fetching staff order:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching staff order",
      error: error.message,
    })
  }
}

// Get staff order by orderId
exports.getStaffOrderByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params
    console.log("Looking for order with orderId:", orderId)

    const staffOrder = await StaffOrder.findOne({ orderId })
      .populate("branchId", "name address")
      .populate("tableId", "number capacity")
      .populate("userId", "name mobile")

    if (!staffOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    console.log("Found order:", staffOrder.orderId)

    res.status(200).json({
      success: true,
      order: staffOrder,
    })
  } catch (error) {
    console.error("Error fetching order by orderId:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    })
  }
}

// Update a staff order status (UPDATED to include payment status)
exports.updateStaffOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus, paymentMethod, notes } = req.body

    const updateData = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (paymentMethod) updateData.paymentMethod = paymentMethod
    if (notes !== undefined) updateData.notes = notes

    // Validate payment status if provided
    if (paymentStatus) {
      const validPaymentStatuses = ["pending", "completed", "failed", "refunded"]
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        })
      }
    }

    // Validate payment method if provided
    if (paymentMethod) {
      const validPaymentMethods = ["card", "upi", "netbanking", "cash", "wallet"]
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        })
      }
    }

    const staffOrder = await StaffOrder.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("branchId", "name address")
      .populate("tableId", "number capacity")
      .populate("userId", "name mobile")

    if (!staffOrder) {
      return res.status(404).json({
        success: false,
        message: "Staff order not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: staffOrder,
    })
  } catch (error) {
    console.error("Error updating staff order:", error)
    res.status(400).json({
      success: false,
      message: "Error updating staff order",
      error: error.message,
    })
  }
}

// Delete a staff order (only pending orders)
exports.deleteStaffOrder = async (req, res) => {
  try {
    const staffOrder = await StaffOrder.findById(req.params.id)

    if (!staffOrder) {
      return res.status(404).json({
        success: false,
        message: "Staff order not found",
      })
    }

    // Only allow deletion of pending orders
    if (staffOrder.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be deleted",
      })
    }

    await StaffOrder.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Staff order deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting staff order:", error)
    res.status(500).json({
      success: false,
      message: "Error deleting staff order",
      error: error.message,
    })
  }
}

// Add items to an existing staff order
exports.addItemsToStaffOrder = async (req, res) => {
  try {
    const { items } = req.body

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request must contain at least one item",
      })
    }

    // Find the staff order
    const staffOrder = await StaffOrder.findById(req.params.id)
    if (!staffOrder) {
      return res.status(404).json({
        success: false,
        message: "Staff order not found",
      })
    }

    // Only allow adding items to pending or preparing orders
    if (!["pending", "preparing"].includes(staffOrder.status)) {
      return res.status(400).json({
        success: false,
        message: "Items can only be added to pending or preparing orders",
      })
    }

    // Process each new item
    for (const item of items) {
      // Check if the item already exists in the order
      const existingItemIndex = staffOrder.items.findIndex(
        (orderItem) => orderItem.menuItemId.toString() === item.menuItemId,
      )

      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        staffOrder.items[existingItemIndex].quantity += item.quantity
      } else {
        // Add new item to order
        staffOrder.items.push({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "",
          description: item.description || "",
        })
      }
      // Update subtotal
      staffOrder.subtotal += item.price * item.quantity
    }

    // Recalculate tax, service charge, and total
    staffOrder.tax = staffOrder.subtotal * 0.05
    staffOrder.serviceCharge = staffOrder.subtotal * 0.1
    staffOrder.totalAmount = staffOrder.subtotal
    staffOrder.grandTotal = staffOrder.subtotal + staffOrder.tax + staffOrder.serviceCharge

    await staffOrder.save()

    res.status(200).json({
      success: true,
      message: "Items added to staff order successfully",
      order: staffOrder,
    })
  } catch (error) {
    console.error("Error adding items to staff order:", error)
    res.status(400).json({
      success: false,
      message: "Error adding items to staff order",
      error: error.message,
    })
  }
}

// Get staff orders by branch and table
exports.getStaffOrdersByTable = async (req, res) => {
  try {
    const { branchId, tableId } = req.params

    const filter = {
      status: { $in: ["pending", "preparing", "served"] },
    }

    if (branchId) filter.branchId = branchId
    if (tableId) filter.tableId = tableId

    const staffOrders = await StaffOrder.find(filter)
      .populate("branchId", "name address")
      .populate("tableId", "number capacity")
      .populate("userId", "name mobile")
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: staffOrders.length,
      orders: staffOrders,
    })
  } catch (error) {
    console.error("Error fetching staff orders for table:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching staff orders for table",
      error: error.message,
    })
  }
}

// Get orders by payment status
exports.getOrdersByPaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.params

    const orders = await StaffOrder.find({ paymentStatus })
      .populate("branchId", "name address")
      .populate("tableId", "number capacity")
      .populate("userId", "name mobile")
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    })
  } catch (error) {
    console.error("Error fetching orders by payment status:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching orders by payment status",
      error: error.message,
    })
  }
}

// Get orders by branch
exports.getOrdersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params
    const { status, paymentStatus, userId } = req.query

    const filter = { branchId }
    if (status) filter.status = status
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (userId) filter.userId = userId

    const orders = await StaffOrder.find(filter)
      .populate("branchId", "name address")
      .populate("tableId", "number capacity")
      .populate("userId", "name mobile")
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    })
  } catch (error) {
    console.error("Error fetching orders by branch:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching orders by branch",
      error: error.message,
    })
  }
}

// Get order statistics
exports.getOrderStatistics = async (req, res) => {
  try {
    const { branchId, userId } = req.query

    const matchFilter = {}
    if (branchId) matchFilter.branchId = new mongoose.Types.ObjectId(branchId)
    if (userId) matchFilter.userId = new mongoose.Types.ObjectId(userId)

    const stats = await StaffOrder.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          averageOrderValue: { $avg: "$grandTotal" },
        },
      },
    ])

    const paymentStats = await StaffOrder.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
        },
      },
    ])

    const branchStats = await StaffOrder.aggregate([
      { $match: userId ? { userId: new mongoose.Types.ObjectId(userId) } : {} },
      {
        $group: {
          _id: "$branchId",
          branchName: { $first: "$branchName" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ])

    res.status(200).json({
      success: true,
      statistics: stats[0] || {},
      paymentMethodStats: paymentStats,
      branchStats,
    })
  } catch (error) {
    console.error("Error fetching order statistics:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching order statistics",
      error: error.message,
    })
  }
}


exports.updateKitchenStatus = async (req, res) => {
  try {
    const {  itemId } = req.params;
    const { kitchenStatus } = req.body;

    // Find the order
    const order = await StaffOrder.findOne({ "items._id": itemId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Find the item inside the order
    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in order",
      });
    }

    // Update the kitchenStatus
    item.kitchenStatus = kitchenStatus;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Kitchen status updated successfully",
      item,
      order,
    });
  } catch (error) {
    console.error("Error updating kitchen status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating kitchen status",
      error: error.message,
    });
  }
};
