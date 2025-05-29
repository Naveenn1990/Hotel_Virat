const CounterBill = require("../model/counterBillModel")
const CounterOrder = require("../model/counterOrderModel")
const CounterInvoice = require("../model/counterInvoiceModel")
const Branch = require("../model/Branch")
const Menu = require("../model/menuModel")
const Counter = require("../model/counterLoginModel")
const asyncHandler = require("express-async-handler")

const VALID_TAX_RATE = 0.05 // 5%
const VALID_SERVICE_CHARGE_RATE = 0.1 // 10%

exports.createCounterBill = asyncHandler(async (req, res) => {
  const {
    userId,
    orderId,
    invoiceId,
    branchId,
    customerName,
    phoneNumber,
    items,
    subtotal,
    taxRate,
    taxAmount,
    serviceChargeRate,
    serviceChargeAmount,
    totalAmount,
    date,
    time,
  } = req.body

  // Input validation
  if (!userId || !orderId || !invoiceId || !branchId || !customerName || !phoneNumber || !items || !date || !time) {
    res.status(400)
    throw new Error("All required fields must be provided")
  }

  if (!/^\d{10}$/.test(phoneNumber)) {
    res.status(400)
    throw new Error("Phone number must be a valid 10-digit number")
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400)
    throw new Error("Items array is required and must not be empty")
  }

  if (subtotal <= 0 || taxAmount < 0 || serviceChargeAmount < 0 || totalAmount <= 0) {
    res.status(400)
    throw new Error("Subtotal and total amount must be greater than zero; tax and service charge cannot be negative")
  }

  if (taxRate !== VALID_TAX_RATE) {
    res.status(400)
    throw new Error(`Tax rate must be ${VALID_TAX_RATE * 100}%`)
  }

  if (serviceChargeRate !== VALID_SERVICE_CHARGE_RATE) {
    res.status(400)
    throw new Error(`Service charge rate must be ${VALID_SERVICE_CHARGE_RATE * 100}%`)
  }

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    res.status(400)
    throw new Error("Date must be in DD/MM/YYYY format")
  }

  if (!/^\d{1,2}:\d{2}\s(?:AM|PM)$/.test(time)) {
    res.status(400)
    throw new Error("Time must be in HH:MM AM/PM format")
  }

  // Parallel validation
  const [counterUser, counterOrder, invoice, branch] = await Promise.all([
    Counter.findById(userId),
    CounterOrder.findById(orderId),
    CounterInvoice.findById(invoiceId),
    Branch.findById(branchId),
  ])

  if (!counterUser) {
    res.status(404)
    throw new Error("Counter user not found")
  }

  if (!counterOrder) {
    res.status(404)
    throw new Error("Counter order not found")
  }

  if (!invoice) {
    res.status(404)
    throw new Error("Invoice not found")
  }

  if (!branch) {
    res.status(404)
    throw new Error("Branch not found")
  }

  if (counterOrder.userId.toString() !== userId) {
    res.status(400)
    throw new Error("User ID does not match the order")
  }

  const existingBill = await CounterBill.findOne({ order: orderId })
  if (existingBill) {
    res.status(400)
    throw new Error("A counter bill already exists for this order")
  }

  if (items.length !== counterOrder.items.length) {
    res.status(400)
    throw new Error(`Item count mismatch: provided ${items.length}, expected ${counterOrder.items.length}`)
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const orderItem = counterOrder.items[i]

    if (!item.menuItemId || !item.name || !item.quantity || !item.price) {
      res.status(400)
      throw new Error("Invalid item data: missing required fields")
    }

    const menuItem = await Menu.findById(item.menuItemId)
    if (!menuItem) {
      res.status(404)
      throw new Error(`Menu item ${item.name} not found`)
    }

    if (menuItem.price !== item.price) {
      res.status(400)
      throw new Error(`Price mismatch for ${item.name}: provided ₹${item.price}, expected ₹${menuItem.price}`)
    }

    if (
      item.menuItemId.toString() !== orderItem.menuItemId.toString() ||
      item.name !== orderItem.name ||
      item.quantity !== orderItem.quantity ||
      item.price !== orderItem.price
    ) {
      res.status(400)
      throw new Error(`Item ${item.name} does not match counter order details`)
    }
  }

  const calculatedTaxAmount = subtotal * taxRate
  const calculatedServiceChargeAmount = subtotal * serviceChargeRate
  const calculatedTotal = subtotal + calculatedTaxAmount + calculatedServiceChargeAmount

  if (Math.abs(taxAmount - calculatedTaxAmount) > 0.01) {
    res.status(400)
    throw new Error("Tax amount calculation mismatch")
  }

  if (Math.abs(serviceChargeAmount - calculatedServiceChargeAmount) > 0.01) {
    res.status(400)
    throw new Error("Service charge amount calculation mismatch")
  }

  if (Math.abs(totalAmount - calculatedTotal) > 0.01) {
    res.status(400)
    throw new Error("Total amount calculation mismatch")
  }

  // Create bill
  const counterBill = new CounterBill({
    userId,
    order: orderId,
    invoice: invoiceId,
    branch: branchId,
    customerName,
    phoneNumber,
    items,
    subtotal,
    taxRate,
    taxAmount,
    serviceChargeRate,
    serviceChargeAmount,
    totalAmount,
    date,
    time,
  })

  await counterBill.save()

  const populatedBill = await CounterBill.findById(counterBill._id)
    .populate("userId", "name mobile")
    .populate("order", "items totalAmount paymentMethod")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  if (!populatedBill.branch || !populatedBill.invoice || !populatedBill.order || !populatedBill.userId) {
    res.status(500)
    throw new Error("Failed to populate required counter bill references")
  }

  res.status(201).json({
    message: "Counter bill created successfully",
    bill: {
      id: populatedBill._id,
      userId: {
        id: populatedBill.userId._id,
        name: populatedBill.userId.name,
        mobile: populatedBill.userId.mobile,
      },
      order: {
        id: populatedBill.order._id,
        items: populatedBill.order.items,
        totalAmount: populatedBill.order.totalAmount,
        paymentMethod: populatedBill.order.paymentMethod,
      },
      invoice: {
        id: populatedBill.invoice._id,
        invoiceNumber: populatedBill.invoice.invoiceNumber,
      },
      branch: {
        id: populatedBill.branch._id,
        name: populatedBill.branch.name,
        location: populatedBill.branch.address,
      },
      customerName: populatedBill.customerName,
      phoneNumber: populatedBill.phoneNumber,
      items: populatedBill.items,
      subtotal: populatedBill.subtotal,
      taxRate: populatedBill.taxRate,
      taxAmount: populatedBill.taxAmount,
      serviceChargeRate: populatedBill.serviceChargeRate,
      serviceChargeAmount: populatedBill.serviceChargeAmount,
      totalAmount: populatedBill.totalAmount,
      date: populatedBill.date,
      time: populatedBill.time,
      createdAt: populatedBill.createdAt,
    },
  })
})

exports.getCounterBillById = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid bill ID format")
  }

  const counterBill = await CounterBill.findById(id)
    .populate("userId", "name mobile")
    .populate("order", "items totalAmount paymentMethod")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  if (!counterBill) {
    res.status(404)
    throw new Error("Counter bill not found")
  }

  if (!counterBill.branch || !counterBill.invoice || !counterBill.order || !counterBill.userId) {
    res.status(500)
    throw new Error("Required counter bill references are missing")
  }

  res.status(200).json({
    bill: {
      id: counterBill._id,
      userId: {
        id: counterBill.userId._id,
        name: counterBill.userId.name,
        mobile: counterBill.userId.mobile,
      },
      order: {
        id: counterBill.order._id,
        items: counterBill.order.items,
        totalAmount: counterBill.order.totalAmount,
        paymentMethod: counterBill.order.paymentMethod,
      },
      invoice: {
        id: counterBill.invoice._id,
        invoiceNumber: counterBill.invoice.invoiceNumber,
      },
      branch: {
        id: counterBill.branch._id,
        name: counterBill.branch.name,
        location: counterBill.branch.address,
      },
      customerName: counterBill.customerName,
      phoneNumber: counterBill.phoneNumber,
      items: counterBill.items,
      subtotal: counterBill.subtotal,
      taxRate: counterBill.taxRate,
      taxAmount: counterBill.taxAmount,
      serviceChargeRate: counterBill.serviceChargeRate,
      serviceChargeAmount: counterBill.serviceChargeAmount,
      totalAmount: counterBill.totalAmount,
      date: counterBill.date,
      time: counterBill.time,
      createdAt: counterBill.createdAt,
    },
  })
})

exports.listCounterBills = asyncHandler(async (req, res) => {
  const { branchId, customerName, phoneNumber, startDate, endDate } = req.query
  const query = {}

  if (branchId) query.branch = branchId
  if (customerName) query.customerName = { $regex: customerName, $options: "i" }
  if (phoneNumber) query.phoneNumber = phoneNumber
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate }
  }

  const counterBills = await CounterBill.find(query)
    .populate("userId", "name mobile")
    .populate("order", "items totalAmount paymentMethod")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")
    .sort({ createdAt: -1 })

  // Add null checks to prevent undefined errors
  const formattedBills = counterBills
    .map((bill) => {
      // Check if all required populated fields exist
      if (!bill.userId || !bill.order || !bill.invoice || !bill.branch) {
        console.warn(`Bill ${bill._id} has missing populated references`)
        return null
      }

      return {
        id: bill._id,
        userId: {
          id: bill.userId._id,
          name: bill.userId.name,
          mobile: bill.userId.mobile,
        },
        order: {
          id: bill.order._id,
          items: bill.order.items || [],
          totalAmount: bill.order.totalAmount,
          paymentMethod: bill.order.paymentMethod,
        },
        invoice: {
          id: bill.invoice._id,
          invoiceNumber: bill.invoice.invoiceNumber,
        },
        branch: {
          id: bill.branch._id,
          name: bill.branch.name,
          location: bill.branch.address,
        },
        customerName: bill.customerName,
        phoneNumber: bill.phoneNumber,
        items: bill.items || [],
        subtotal: bill.subtotal,
        taxRate: bill.taxRate,
        taxAmount: bill.taxAmount,
        serviceChargeRate: bill.serviceChargeRate,
        serviceChargeAmount: bill.serviceChargeAmount,
        totalAmount: bill.totalAmount,
        date: bill.date,
        time: bill.time,
        createdAt: bill.createdAt,
      }
    })
    .filter((bill) => bill !== null) // Remove any null entries

  res.status(200).json({
    message: "Counter bills retrieved successfully",
    count: formattedBills.length,
    bills: formattedBills,
  })
})
