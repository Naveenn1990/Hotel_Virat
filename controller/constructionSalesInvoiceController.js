const ConstructionSalesInvoice = require("../model/constructionSalesInvoice")
const ConstructionClient = require("../model/constructionClient")
const ConstructionProject = require("../model/constructionProject")
const ConstructionWorkOrder = require("../model/constructionWorkOrder")

// @desc    Get all sales invoices
// @route   GET /construction/sales-invoices
// @access  Public
const getConstructionSalesInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, clientId, projectId, status, paymentStatus, startDate, endDate, search } = req.query

    // Build filter object
    const filter = {}

    if (clientId) filter.clientId = clientId
    if (projectId) filter.projectId = projectId
    if (status) filter.status = status
    if (paymentStatus) filter.paymentStatus = paymentStatus

    if (startDate || endDate) {
      filter.invoiceDate = {}
      if (startDate) filter.invoiceDate.$gte = new Date(startDate)
      if (endDate) filter.invoiceDate.$lte = new Date(endDate)
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } },
        { projectName: { $regex: search, $options: "i" } },
      ]
    }

    const invoices = await ConstructionSalesInvoice.find(filter)
      .populate("clientId", "clientName gstin contactPerson")
      .populate("projectId", "projectName location")
      .populate("workOrders.workOrderId", "taskName workOrderNumber")
      .sort({ invoiceDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await ConstructionSalesInvoice.countDocuments(filter)

    console.log(`✅ Retrieved ${invoices.length} sales invoices`)

    res.json({
      success: true,
      data: invoices,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("❌ Error fetching sales invoices:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching sales invoices",
      error: error.message,
    })
  }
}

// @desc    Get single sales invoice
// @route   GET /construction/sales-invoices/:id
// @access  Public
const getConstructionSalesInvoice = async (req, res) => {
  try {
    const invoice = await ConstructionSalesInvoice.findById(req.params.id)
      .populate("clientId", "clientName gstin contactPerson email phone address")
      .populate("projectId", "projectName location startDate endDate")
      .populate("workOrders.workOrderId", "taskName workOrderNumber description materials")

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Sales invoice not found",
      })
    }

    // Update viewed status if not already viewed
    if (invoice.status === "sent" && !invoice.viewedDate) {
      invoice.status = "viewed"
      invoice.viewedDate = new Date()
      await invoice.save()
    }

    console.log(`✅ Retrieved sales invoice: ${invoice.invoiceNumber}`)

    res.json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    console.error("❌ Error fetching sales invoice:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching sales invoice",
      error: error.message,
    })
  }
}

// @desc    Create new sales invoice
// @route   POST /construction/sales-invoices
// @access  Public
const createConstructionSalesInvoice = async (req, res) => {
  try {
    const { clientId, projectId, workOrderIds, invoiceDate, dueDate, notes, paymentTerms, companyInfo } = req.body

    // Validate required fields
    if (!clientId || !projectId || !workOrderIds || workOrderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Client, project, and work orders are required",
      })
    }

    // Get client information
    const client = await ConstructionClient.findById(clientId)
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      })
    }

    // Get project information
    const project = await ConstructionProject.findById(projectId)
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      })
    }

    // Get work orders and validate they are completed
    const workOrders = await ConstructionWorkOrder.find({
      _id: { $in: workOrderIds },
      status: "completed",
    })

    if (workOrders.length !== workOrderIds.length) {
      return res.status(400).json({
        success: false,
        message: "All work orders must be completed before invoicing",
      })
    }

    // Generate invoice number
    const invoiceNumber = await ConstructionSalesInvoice.generateInvoiceNumber()

    // Determine GST type based on client state
    const gstType = client.address?.state === companyInfo?.state ? "CGST_SGST" : "IGST"

    // Prepare work order data for invoice
    const invoiceWorkOrders = workOrders.map((wo) => ({
      workOrderId: wo._id,
      taskName: wo.taskName,
      quantity: wo.quantity || 1,
      rate: wo.ratePerUnit || wo.totalCost || 0,
      amount: wo.totalCost || wo.estimatedHours * 65, // Default rate calculation
      description: wo.description,
    }))

    // Create invoice
    const invoice = new ConstructionSalesInvoice({
      invoiceNumber,
      invoiceDate: invoiceDate || new Date(),
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      clientId,
      clientName: client.clientName,
      clientGSTIN: client.gstin,
      clientAddress: client.address,
      projectId,
      projectName: project.projectName,
      workOrders: invoiceWorkOrders,
      gstType,
      notes,
      paymentTerms: paymentTerms || "Net 30 days",
      companyInfo: companyInfo || {},
      createdBy: req.user?.name || "System",
    })

    await invoice.save()

    // Update work orders status to 'billed'
    await ConstructionWorkOrder.updateMany(
      { _id: { $in: workOrderIds } },
      {
        status: "billed",
        billedDate: new Date(),
        invoiceId: invoice._id,
      },
    )

    console.log(`✅ Created sales invoice: ${invoice.invoiceNumber}`)

    res.status(201).json({
      success: true,
      message: "Sales invoice created successfully",
      data: invoice,
    })
  } catch (error) {
    console.error("❌ Error creating sales invoice:", error)
    res.status(500).json({
      success: false,
      message: "Error creating sales invoice",
      error: error.message,
    })
  }
}

// @desc    Update sales invoice
// @route   PUT /construction/sales-invoices/:id
// @access  Public
const updateConstructionSalesInvoice = async (req, res) => {
  try {
    const invoice = await ConstructionSalesInvoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Sales invoice not found",
      })
    }

    // Don't allow updates to paid invoices
    if (invoice.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot update paid invoices",
      })
    }

    const updatedInvoice = await ConstructionSalesInvoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?.name || "System" },
      { new: true, runValidators: true },
    )

    console.log(`✅ Updated sales invoice: ${updatedInvoice.invoiceNumber}`)

    res.json({
      success: true,
      message: "Sales invoice updated successfully",
      data: updatedInvoice,
    })
  } catch (error) {
    console.error("❌ Error updating sales invoice:", error)
    res.status(500).json({
      success: false,
      message: "Error updating sales invoice",
      error: error.message,
    })
  }
}

// @desc    Update invoice status
// @route   PATCH /construction/sales-invoices/:id/status
// @access  Public
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ["draft", "sent", "viewed", "paid", "cancelled"]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      })
    }

    const updateData = { status }

    const invoice = await ConstructionSalesInvoice.findById(req.params.id)

    if (status === "sent" && invoice && !invoice.sentDate) {
      updateData.sentDate = new Date()
    }

    const invoiceUpdated = await ConstructionSalesInvoice.findByIdAndUpdate(req.params.id, updateData, { new: true })

    if (!invoiceUpdated) {
      return res.status(404).json({
        success: false,
        message: "Sales invoice not found",
      })
    }

    console.log(`✅ Updated invoice status: ${invoiceUpdated.invoiceNumber} -> ${status}`)

    res.json({
      success: true,
      message: "Invoice status updated successfully",
      data: invoiceUpdated,
    })
  } catch (error) {
    console.error("❌ Error updating invoice status:", error)
    res.status(500).json({
      success: false,
      message: "Error updating invoice status",
      error: error.message,
    })
  }
}

// @desc    Record payment for invoice
// @route   PATCH /construction/sales-invoices/:id/payment
// @access  Public
const recordPayment = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMode, referenceNumber, remarks } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required",
      })
    }

    const invoice = await ConstructionSalesInvoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Sales invoice not found",
      })
    }

    // Check if payment amount is valid
    const remainingAmount = invoice.totalAmount - invoice.paidAmount
    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed outstanding amount of ₹${remainingAmount}`,
      })
    }

    // Update paid amount
    invoice.paidAmount += amount

    // The pre-save middleware will handle status updates
    await invoice.save()

    // Create payment record (you might want a separate Payment model)
    const paymentRecord = {
      invoiceId: invoice._id,
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMode: paymentMode || "Bank Transfer",
      referenceNumber,
      remarks,
      recordedBy: req.user?.name || "System",
      recordedAt: new Date(),
    }

    console.log(`✅ Recorded payment: ₹${amount} for invoice ${invoice.invoiceNumber}`)

    res.json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        invoice,
        payment: paymentRecord,
      },
    })
  } catch (error) {
    console.error("❌ Error recording payment:", error)
    res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    })
  }
}

// @desc    Get invoices by client
// @route   GET /construction/sales-invoices/client/:clientId
// @access  Public
const getInvoicesByClient = async (req, res) => {
  try {
    const invoices = await ConstructionSalesInvoice.find({ clientId: req.params.clientId })
      .populate("projectId", "projectName")
      .sort({ invoiceDate: -1 })

    res.json({
      success: true,
      data: invoices,
    })
  } catch (error) {
    console.error("❌ Error fetching client invoices:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching client invoices",
      error: error.message,
    })
  }
}

// @desc    Get invoices by project
// @route   GET /construction/sales-invoices/project/:projectId
// @access  Public
const getInvoicesByProject = async (req, res) => {
  try {
    const invoices = await ConstructionSalesInvoice.find({ projectId: req.params.projectId })
      .populate("clientId", "clientName")
      .sort({ invoiceDate: -1 })

    res.json({
      success: true,
      data: invoices,
    })
  } catch (error) {
    console.error("❌ Error fetching project invoices:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching project invoices",
      error: error.message,
    })
  }
}

// @desc    Get invoice statistics
// @route   GET /construction/sales-invoices/stats
// @access  Public
const getInvoiceStats = async (req, res) => {
  try {
    const stats = await ConstructionSalesInvoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalOutstanding: { $sum: "$outstandingAmount" },
          totalGST: { $sum: "$totalGSTAmount" },
        },
      },
    ])

    const statusStats = await ConstructionSalesInvoice.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
    ])

    const monthlyStats = await ConstructionSalesInvoice.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$invoiceDate" },
            month: { $month: "$invoiceDate" },
          },
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ])

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalInvoices: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalGST: 0,
        },
        byStatus: statusStats,
        monthly: monthlyStats,
      },
    })
  } catch (error) {
    console.error("❌ Error fetching invoice stats:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching invoice statistics",
      error: error.message,
    })
  }
}

// @desc    Get overdue invoices
// @route   GET /construction/sales-invoices/overdue
// @access  Public
const getOverdueInvoices = async (req, res) => {
  try {
    const overdueInvoices = await ConstructionSalesInvoice.find({
      dueDate: { $lt: new Date() },
      paymentStatus: { $in: ["unpaid", "partial"] },
    })
      .populate("clientId", "clientName contactPerson phone email")
      .populate("projectId", "projectName")
      .sort({ dueDate: 1 })

    res.json({
      success: true,
      data: overdueInvoices,
    })
  } catch (error) {
    console.error("❌ Error fetching overdue invoices:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching overdue invoices",
      error: error.message,
    })
  }
}

// @desc    Generate invoice PDF
// @route   GET /construction/sales-invoices/:id/pdf
// @access  Public
const generateInvoicePDF = async (req, res) => {
  try {
    // This would integrate with a PDF generation library like puppeteer or jsPDF
    res.json({
      success: true,
      message: "PDF generation feature coming soon",
      downloadUrl: `/construction/sales-invoices/${req.params.id}/pdf`,
    })
  } catch (error) {
    console.error("❌ Error generating PDF:", error)
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
      error: error.message,
    })
  }
}

// @desc    Send invoice via email
// @route   POST /construction/sales-invoices/:id/send-email
// @access  Public
const sendInvoiceEmail = async (req, res) => {
  try {
    // This would integrate with an email service
    const invoice = await ConstructionSalesInvoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      })
    }

    // Update status to sent
    invoice.status = "sent"
    invoice.sentDate = new Date()
    await invoice.save()

    res.json({
      success: true,
      message: "Invoice sent successfully (email integration coming soon)",
    })
  } catch (error) {
    console.error("❌ Error sending invoice:", error)
    res.status(500).json({
      success: false,
      message: "Error sending invoice",
      error: error.message,
    })
  }
}

// @desc    Get GST report
// @route   GET /construction/sales-invoices/gst-report
// @access  Public
const getGSTReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const filter = {}

    if (startDate || endDate) {
      filter.invoiceDate = {}
      if (startDate) filter.invoiceDate.$gte = new Date(startDate)
      if (endDate) filter.invoiceDate.$lte = new Date(endDate)
    }

    const gstReport = await ConstructionSalesInvoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$gstType",
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: "$subtotal" },
          totalCGST: { $sum: "$cgstAmount" },
          totalSGST: { $sum: "$sgstAmount" },
          totalIGST: { $sum: "$igstAmount" },
          totalGST: { $sum: "$totalGSTAmount" },
        },
      },
    ])

    res.json({
      success: true,
      data: gstReport,
    })
  } catch (error) {
    console.error("❌ Error generating GST report:", error)
    res.status(500).json({
      success: false,
      message: "Error generating GST report",
      error: error.message,
    })
  }
}

// @desc    Get outstanding report
// @route   GET /construction/sales-invoices/outstanding-report
// @access  Public
const getOutstandingReport = async (req, res) => {
  try {
    const outstandingReport = await ConstructionSalesInvoice.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["unpaid", "partial", "overdue"] },
        },
      },
      {
        $lookup: {
          from: "constructionclients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      {
        $unwind: "$client",
      },
      {
        $group: {
          _id: "$clientId",
          clientName: { $first: "$client.clientName" },
          totalOutstanding: { $sum: "$outstandingAmount" },
          invoiceCount: { $sum: 1 },
          oldestInvoice: { $min: "$invoiceDate" },
        },
      },
      { $sort: { totalOutstanding: -1 } },
    ])

    res.json({
      success: true,
      data: outstandingReport,
    })
  } catch (error) {
    console.error("❌ Error generating outstanding report:", error)
    res.status(500).json({
      success: false,
      message: "Error generating outstanding report",
      error: error.message,
    })
  }
}

// @desc    Delete sales invoice
// @route   DELETE /construction/sales-invoices/:id
// @access  Public
const deleteConstructionSalesInvoice = async (req, res) => {
  try {
    const invoice = await ConstructionSalesInvoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Sales invoice not found",
      })
    }

    // Don't allow deletion of paid invoices
    if (invoice.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete paid invoices",
      })
    }

    // Update work orders back to completed status
    await ConstructionWorkOrder.updateMany(
      { invoiceId: invoice._id },
      {
        $unset: { invoiceId: 1, billedDate: 1 },
        status: "completed",
      },
    )

    await ConstructionSalesInvoice.findByIdAndDelete(req.params.id)

    console.log(`✅ Deleted sales invoice: ${invoice.invoiceNumber}`)

    res.json({
      success: true,
      message: "Sales invoice deleted successfully",
    })
  } catch (error) {
    console.error("❌ Error deleting sales invoice:", error)
    res.status(500).json({
      success: false,
      message: "Error deleting sales invoice",
      error: error.message,
    })
  }
}

module.exports = {
  getConstructionSalesInvoices,
  getConstructionSalesInvoice,
  createConstructionSalesInvoice,
  updateConstructionSalesInvoice,
  deleteConstructionSalesInvoice,
  updateInvoiceStatus,
  recordPayment,
  getInvoicesByClient,
  getInvoicesByProject,
  getInvoiceStats,
  getOverdueInvoices,
  generateInvoicePDF,
  sendInvoiceEmail,
  getGSTReport,
  getOutstandingReport,
}
