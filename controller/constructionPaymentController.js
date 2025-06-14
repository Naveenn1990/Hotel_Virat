const ConstructionPayment = require("../model/ConstructionPayment")
const ConstructionSalesInvoice = require("../model/ConstructionSalesInvoice")
const asyncHandler = require("express-async-handler")

// Generate construction payment number
const generateConstructionPaymentNumber = async () => {
  const count = await ConstructionPayment.countDocuments()
  return `CPAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`
}

// @desc    Get all construction payments
// @route   GET /api/construction/sales/payments
// @access  Private
const getConstructionPayments = asyncHandler(async (req, res) => {
  const { clientId, invoiceId } = req.query

  const filter = {}
  if (clientId) filter.clientId = clientId
  if (invoiceId) filter.invoiceId = invoiceId

  const payments = await ConstructionPayment.find(filter)
    .populate("clientId", "clientName")
    .populate("invoiceId", "invoiceNumber")
    .sort({ createdAt: -1 })

  res.json(payments)
})

// @desc    Get single construction payment
// @route   GET /api/construction/sales/payments/:id
// @access  Private
const getConstructionPayment = asyncHandler(async (req, res) => {
  const payment = await ConstructionPayment.findById(req.params.id).populate("clientId").populate("invoiceId")

  if (!payment) {
    res.status(404)
    throw new Error("Construction payment not found")
  }

  res.json(payment)
})

// @desc    Record new construction payment
// @route   POST /api/construction/sales/payments
// @access  Private
const recordConstructionPayment = asyncHandler(async (req, res) => {
  const { invoiceId, amount, paymentDate, paymentMethod, referenceNumber, remarks } = req.body

  // Verify construction invoice exists
  const invoice = await ConstructionSalesInvoice.findById(invoiceId)
  if (!invoice) {
    res.status(404)
    throw new Error("Construction invoice not found")
  }

  // Check if payment amount is valid
  if (amount <= 0 || amount > invoice.outstandingAmount) {
    res.status(400)
    throw new Error("Invalid payment amount")
  }

  const paymentNumber = await generateConstructionPaymentNumber()

  const payment = await ConstructionPayment.create({
    paymentNumber,
    invoiceId,
    clientId: invoice.clientId,
    amount,
    paymentDate,
    paymentMethod,
    referenceNumber,
    remarks,
  })

  // Update construction invoice payment status
  invoice.paidAmount += amount
  await invoice.save()

  const populatedPayment = await ConstructionPayment.findById(payment._id)
    .populate("clientId", "clientName")
    .populate("invoiceId", "invoiceNumber")

  res.status(201).json(populatedPayment)
})

// @desc    Update construction payment
// @route   PUT /api/construction/sales/payments/:id
// @access  Private
const updateConstructionPayment = asyncHandler(async (req, res) => {
  const payment = await ConstructionPayment.findById(req.params.id)

  if (!payment) {
    res.status(404)
    throw new Error("Construction payment not found")
  }

  const oldAmount = payment.amount
  const newAmount = req.body.amount || oldAmount

  const updatedPayment = await ConstructionPayment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("clientId", "clientName")
    .populate("invoiceId", "invoiceNumber")

  // Update construction invoice if amount changed
  if (oldAmount !== newAmount) {
    const invoice = await ConstructionSalesInvoice.findById(payment.invoiceId)
    invoice.paidAmount = invoice.paidAmount - oldAmount + newAmount
    await invoice.save()
  }

  res.json(updatedPayment)
})

// @desc    Delete construction payment
// @route   DELETE /api/construction/sales/payments/:id
// @access  Private
const deleteConstructionPayment = asyncHandler(async (req, res) => {
  const payment = await ConstructionPayment.findById(req.params.id)

  if (!payment) {
    res.status(404)
    throw new Error("Construction payment not found")
  }

  // Update construction invoice payment status
  const invoice = await ConstructionSalesInvoice.findById(payment.invoiceId)
  invoice.paidAmount -= payment.amount
  await invoice.save()

  await ConstructionPayment.findByIdAndDelete(req.params.id)

  res.json({ message: "Construction payment deleted successfully" })
})

// @desc    Get recent construction payments
// @route   GET /api/construction/sales/payments/recent
// @access  Private
const getRecentConstructionPayments = asyncHandler(async (req, res) => {
  const recentPayments = await ConstructionPayment.find({})
    .populate("clientId", "clientName")
    .populate("invoiceId", "invoiceNumber")
    .sort({ paymentDate: -1 })
    .limit(10)

  res.json(recentPayments)
})

// @desc    Get construction payment statistics
// @route   GET /api/construction/sales/payments/stats
// @access  Private
const getConstructionPaymentStats = asyncHandler(async (req, res) => {
  const totalPayments = await ConstructionPayment.countDocuments()

  const totalAmount = await ConstructionPayment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])

  const thisMonthPayments = await ConstructionPayment.aggregate([
    {
      $match: {
        paymentDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ])

  const paymentMethods = await ConstructionPayment.aggregate([
    { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$amount" } } },
  ])

  res.json({
    totalPayments,
    totalAmount: totalAmount[0]?.total || 0,
    thisMonthAmount: thisMonthPayments[0]?.total || 0,
    paymentMethods,
  })
})

module.exports = {
  getConstructionPayments,
  getConstructionPayment,
  recordConstructionPayment,
  updateConstructionPayment,
  deleteConstructionPayment,
  getRecentConstructionPayments,
  getConstructionPaymentStats,
}
