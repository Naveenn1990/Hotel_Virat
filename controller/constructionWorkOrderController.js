const ConstructionWorkOrder = require("../model/ConstructionWorkOrder")
const ConstructionProject = require("../model/ConstructionProject")
const asyncHandler = require("express-async-handler")

// Generate construction work order number
const generateConstructionWorkOrderNumber = async () => {
  const count = await ConstructionWorkOrder.countDocuments()
  return `CWO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`
}

// @desc    Get all construction work orders
// @route   GET /api/construction/sales/work-orders
// @access  Private
const getConstructionWorkOrders = asyncHandler(async (req, res) => {
  const { status, projectId } = req.query

  const filter = {}
  if (status) filter.status = status
  if (projectId) filter.projectId = projectId

  const workOrders = await ConstructionWorkOrder.find(filter)
    .populate({
      path: "projectId",
      populate: {
        path: "clientId",
        select: "clientName",
      },
    })
    .sort({ createdAt: -1 })

  res.json(workOrders)
})

// @desc    Get single construction work order
// @route   GET /api/construction/sales/work-orders/:id
// @access  Private
const getConstructionWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await ConstructionWorkOrder.findById(req.params.id).populate({
    path: "projectId",
    populate: {
      path: "clientId",
    },
  })

  if (!workOrder) {
    res.status(404)
    throw new Error("Construction work order not found")
  }

  res.json(workOrder)
})

// @desc    Create new construction work order
// @route   POST /api/construction/sales/work-orders
// @access  Private
const createConstructionWorkOrder = asyncHandler(async (req, res) => {
  const {
    projectId,
    taskName,
    description,
    quantity,
    unit,
    rate,
    assignedTo,
    dueDate,
    estimatedHours,
    priority,
    materials,
  } = req.body

  // Verify construction project exists
  const project = await ConstructionProject.findById(projectId)
  if (!project) {
    res.status(404)
    throw new Error("Construction project not found")
  }

  const workOrderNumber = await generateConstructionWorkOrderNumber()

  const workOrder = await ConstructionWorkOrder.create({
    workOrderNumber,
    projectId,
    taskName,
    description,
    quantity,
    unit,
    rate,
    assignedTo,
    dueDate,
    estimatedHours,
    priority,
    materials,
  })

  // Add work order to construction project's workOrders array
  await ConstructionProject.findByIdAndUpdate(projectId, { $push: { workOrders: workOrder._id } })

  const populatedWorkOrder = await ConstructionWorkOrder.findById(workOrder._id).populate({
    path: "projectId",
    populate: {
      path: "clientId",
      select: "clientName",
    },
  })

  res.status(201).json(populatedWorkOrder)
})

// @desc    Update construction work order
// @route   PUT /api/construction/sales/work-orders/:id
// @access  Private
const updateConstructionWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await ConstructionWorkOrder.findById(req.params.id)

  if (!workOrder) {
    res.status(404)
    throw new Error("Construction work order not found")
  }

  const updatedWorkOrder = await ConstructionWorkOrder.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate({
    path: "projectId",
    populate: {
      path: "clientId",
      select: "clientName",
    },
  })

  res.json(updatedWorkOrder)
})

// @desc    Update construction work order status
// @route   PATCH /api/construction/sales/work-orders/:id/status
// @access  Private
const updateConstructionWorkOrderStatus = asyncHandler(async (req, res) => {
  const { status, completionRemarks, actualHours } = req.body

  const workOrder = await ConstructionWorkOrder.findById(req.params.id)

  if (!workOrder) {
    res.status(404)
    throw new Error("Construction work order not found")
  }

  const updateData = { status }

  if (status === "completed") {
    updateData.completionDate = new Date()
    if (completionRemarks) updateData.completionRemarks = completionRemarks
    if (actualHours) updateData.actualHours = actualHours
  }

  const updatedWorkOrder = await ConstructionWorkOrder.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate({
    path: "projectId",
    populate: {
      path: "clientId",
      select: "clientName",
    },
  })

  res.json(updatedWorkOrder)
})

// @desc    Delete construction work order
// @route   DELETE /api/construction/sales/work-orders/:id
// @access  Private
const deleteConstructionWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await ConstructionWorkOrder.findById(req.params.id)

  if (!workOrder) {
    res.status(404)
    throw new Error("Construction work order not found")
  }

  // Remove work order from construction project's workOrders array
  await ConstructionProject.findByIdAndUpdate(workOrder.projectId, { $pull: { workOrders: req.params.id } })

  await ConstructionWorkOrder.findByIdAndDelete(req.params.id)

  res.json({ message: "Construction work order deleted successfully" })
})

// @desc    Get construction work orders ready for billing
// @route   GET /api/construction/sales/work-orders/ready-for-billing
// @access  Private
const getConstructionWorkOrdersReadyForBilling = asyncHandler(async (req, res) => {
  const workOrders = await ConstructionWorkOrder.find({ status: "completed" })
    .populate({
      path: "projectId",
      populate: {
        path: "clientId",
        select: "clientName",
      },
    })
    .sort({ completionDate: -1 })

  res.json(workOrders)
})

// @desc    Get construction work order statistics
// @route   GET /api/construction/sales/work-orders/stats
// @access  Private
const getConstructionWorkOrderStats = asyncHandler(async (req, res) => {
  const totalWorkOrders = await ConstructionWorkOrder.countDocuments()
  const pendingWorkOrders = await ConstructionWorkOrder.countDocuments({ status: "pending" })
  const inProgressWorkOrders = await ConstructionWorkOrder.countDocuments({ status: "in-progress" })
  const completedWorkOrders = await ConstructionWorkOrder.countDocuments({ status: "completed" })
  const billedWorkOrders = await ConstructionWorkOrder.countDocuments({ status: "billed" })

  const totalValue = await ConstructionWorkOrder.aggregate([{ $group: { _id: null, total: { $sum: "$totalValue" } } }])

  const pendingHours = await ConstructionWorkOrder.aggregate([
    { $match: { status: "pending" } },
    { $group: { _id: null, total: { $sum: "$estimatedHours" } } },
  ])

  const inProgressHours = await ConstructionWorkOrder.aggregate([
    { $match: { status: "in-progress" } },
    { $group: { _id: null, total: { $sum: "$estimatedHours" } } },
  ])

  res.json({
    totalWorkOrders,
    pendingWorkOrders,
    inProgressWorkOrders,
    completedWorkOrders,
    billedWorkOrders,
    totalValue: totalValue[0]?.total || 0,
    pendingHours: pendingHours[0]?.total || 0,
    inProgressHours: inProgressHours[0]?.total || 0,
  })
})

module.exports = {
  getConstructionWorkOrders,
  getConstructionWorkOrder,
  createConstructionWorkOrder,
  updateConstructionWorkOrder,
  updateConstructionWorkOrderStatus,
  deleteConstructionWorkOrder,
  getConstructionWorkOrdersReadyForBilling,
  getConstructionWorkOrderStats,
}
 