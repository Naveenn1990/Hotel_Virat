const ConstructionSalesInvoice = require("../model/ConstructionSalesInvoice")
const ConstructionWorkOrder = require("../model/ConstructionWorkOrder")
const ConstructionClient = require("../model/ConstructionClient")
const ConstructionProject = require("../model/ConstructionProject")
const ConstructionInvoiceSettings = require("../model/ConstructionInvoiceSettings")
const asyncHandler = require("express-async-handler")

// Generate construction invoice number
const generateConstructionInvoiceNumber = async () => {
  const settings = await ConstructionInvoiceSettings.findOne()
  const prefix = settings?.prefix || "SAL"
  const nextNumber = settings?.nextNumber || 1
  const year = new Date().getFullYear()

  const invoiceNumber = `${prefix}-${year}-${String(nextNumber).padStart(3, "0")}`

  // Update next number in settings
  if (settings) {
    settings.nextNumber = nextNumber + 1
    await settings.save()
  }

  return invoiceNumber
}

// @desc    Get all construction invoices
// @route   GET /api/construction/sales/invoices
// @access  Private
const getConstructionInvoices = asyncHandler(async (req, res) => {
  const { status, clientId, paymentStatus } = req.query

  const filter = {}
  if (status) filter.status = status
  if (clientId) filter.clientId = clientId
  if (paymentStatus) filter.paymentStatus = paymentStatus

  const invoices = await ConstructionSalesInvoice.find(filter)
    .populate("clientId", "clientName email")
    .populate("projectId", "projectName")
    .populate("items.workOrderId", "taskName workOrderNumber")
    .sort({ createdAt: -1 })

  res.json(invoices)
})

// @desc    Get single construction invoice
// @route   GET /api/construction/sales/invoices/:id
// @access  Private
const getConstructionInvoice = asyncHandler(async (req, res) => {
  const invoice = await ConstructionSalesInvoice.findById(req.params.id)
    .populate("clientId")
    .populate("projectId")
    .populate("items.workOrderId")

  if (!invoice) {
    res.status(404)
    throw new Error("Construction invoice not found")
  }

  res.json(invoice)
})

// @desc    Create new construction invoice
// @route   POST /api/construction/sales/invoices
// @access  Private
const createConstructionInvoice = asyncHandler(async (req, res) => {
  const { clientId, projectId, workOrderIds, dueDate, notes } = req.body

  // Verify construction client and project exist
  const client = await ConstructionClient.findById(clientId)
  if (!client) {
    res.status(404)
    throw new Error("Construction client not found")
  }

  const project = await ConstructionProject.findById(projectId)
  if (!project) {
    res.status(404)
    throw new Error("Construction project not found")
  }

  // Get construction work orders
  const workOrders = await ConstructionWorkOrder.find({
    _id: { $in: workOrderIds },
    status: "completed",
  })

  if (workOrders.length !== workOrderIds.length) {
    res.status(400)
    throw new Error("Some construction work orders are not completed or not found")
  }

  // Get construction invoice settings for tax calculation
  const settings = await ConstructionInvoiceSettings.findOne()
  const taxRate = settings?.taxRate || 18

  // Determine tax type based on client and company state
  const companyState = settings?.companyState || ""
  const taxType = client.state === companyState ? "CGST_SGST" : "IGST"

  // Create invoice items from construction work orders
  const items = workOrders.map((wo) => ({
    workOrderId: wo._id,
    description: wo.description,
    quantity: wo.quantity,
    rate: wo.rate,
    amount: wo.totalValue,
  }))

  const invoiceNumber = await generateConstructionInvoiceNumber()

  const invoice = await ConstructionSalesInvoice.create({
    invoiceNumber,
    clientId,
    projectId,
    dueDate,
    items,
    taxType,
    taxRate,
    notes,
  })

  // Update construction work orders status to billed
  await ConstructionWorkOrder.updateMany({ _id: { $in: workOrderIds } }, { status: "billed" })

  const populatedInvoice = await ConstructionSalesInvoice.findById(invoice._id)
    .populate("clientId", "clientName email")
    .populate("projectId", "projectName")
    .populate("items.workOrderId", "taskName workOrderNumber")

  res.status(201).json(populatedInvoice)
})

// @desc    Update construction invoice
// @route   PUT /api/construction/sales/invoices/:id
// @access  Private
const updateConstructionInvoice = asyncHandler(async (req, res) => {
  const invoice = await ConstructionSalesInvoice.findById(req.params.id)

  if (!invoice) {
    res.status(404)
    throw new Error("Construction invoice not found")
  }

  const updatedInvoice = await ConstructionSalesInvoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("clientId", "clientName email")
    .populate("projectId", "projectName")
    .populate("items.workOrderId", "taskName workOrderNumber")

  res.json(updatedInvoice)
})

// @desc    Delete construction invoice
// @route   DELETE /api/construction/sales/invoices/:id
// @access  Private
const deleteConstructionInvoice = asyncHandler(async (req, res) => {
  const invoice = await ConstructionSalesInvoice.findById(req.params.id)

  if (!invoice) {
    res.status(404)
    throw new Error("Construction invoice not found")
  }

  // Update construction work orders status back to completed
  const workOrderIds = invoice.items.map((item) => item.workOrderId)
  await ConstructionWorkOrder.updateMany({ _id: { $in: workOrderIds } }, { status: "completed" })

  await ConstructionSalesInvoice.findByIdAndDelete(req.params.id)

  res.json({ message: "Construction invoice deleted successfully" })
})

// @desc    Get construction outstanding balances
// @route   GET /api/construction/sales/invoices/outstanding
// @access  Private
const getConstructionOutstandingBalances = asyncHandler(async (req, res) => {
  const outstandingInvoices = await ConstructionSalesInvoice.find({
    paymentStatus: { $in: ["Unpaid", "Partial"] },
  })
    .populate("clientId", "clientName")
    .select("invoiceNumber clientId totalAmount paidAmount outstandingAmount dueDate paymentStatus")
    .sort({ dueDate: 1 })

  const balances = outstandingInvoices.map((invoice) => ({
    id: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    client: invoice.clientId.clientName,
    amount: invoice.outstandingAmount,
    dueDate: invoice.dueDate,
    status: new Date(invoice.dueDate) < new Date() ? "Overdue" : "Pending",
  }))

  res.json(balances)
})

// @desc    Get construction invoice statistics
// @route   GET /api/construction/sales/invoices/stats
// @access  Private
const getConstructionInvoiceStats = asyncHandler(async (req, res) => {
  const totalInvoices = await ConstructionSalesInvoice.countDocuments()
  const paidInvoices = await ConstructionSalesInvoice.countDocuments({ paymentStatus: "Paid" })
  const unpaidInvoices = await ConstructionSalesInvoice.countDocuments({ paymentStatus: "Unpaid" })
  const overdueInvoices = await ConstructionSalesInvoice.countDocuments({
    paymentStatus: { $in: ["Unpaid", "Partial"] },
    dueDate: { $lt: new Date() },
  })

  const totalAmount = await ConstructionSalesInvoice.aggregate([
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ])

  const outstandingAmount = await ConstructionSalesInvoice.aggregate([
    { $group: { _id: null, total: { $sum: "$outstandingAmount" } } },
  ])

  res.json({
    totalInvoices,
    paidInvoices,
    unpaidInvoices,
    overdueInvoices,
    totalAmount: totalAmount[0]?.total || 0,
    outstandingAmount: outstandingAmount[0]?.total || 0,
  })
})

module.exports = {
  getConstructionInvoices,
  getConstructionInvoice,
  createConstructionInvoice,
  updateConstructionInvoice,
  deleteConstructionInvoice,
  getConstructionOutstandingBalances,
  getConstructionInvoiceStats,
}
