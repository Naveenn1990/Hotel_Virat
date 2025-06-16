const ConstructionProject = require("../model/ConstructionProject")
const ConstructionClient = require("../model/ConstructionClient")
const ConstructionWorkOrder = require("../model/ConstructionWorkOrder")
const asyncHandler = require("express-async-handler")

// @desc    Get all construction projects
// @route   GET /api/construction/sales/projects
// @access  Private
const getConstructionProjects = asyncHandler(async (req, res) => {
  const projects = await ConstructionProject.find({})
    .populate("clientId", "clientName email")
    .populate("workOrders")
    .sort({ createdAt: -1 })

  res.json(projects)
})

// @desc    Get single construction project
// @route   GET /api/construction/sales/projects/:id
// @access  Private
const getConstructionProject = asyncHandler(async (req, res) => {
  const project = await ConstructionProject.findById(req.params.id).populate("clientId").populate("workOrders")

  if (!project) {
    res.status(404)
    throw new Error("Construction project not found")
  }

  res.json(project)
})

// @desc    Create new construction project
// @route   POST /api/construction/sales/projects
// @access  Private
const createConstructionProject = asyncHandler(async (req, res) => {
  const { projectName, clientId, location, startDate, endDate, budget } = req.body

  // Verify construction client exists
  const client = await ConstructionClient.findById(clientId)
  if (!client) {
    res.status(404)
    throw new Error("Construction client not found")
  }

  const project = await ConstructionProject.create({
    projectName,
    clientId,
    location,
    startDate,
    endDate,
    budget,
  })

  // Add project to construction client's projects array
  await ConstructionClient.findByIdAndUpdate(clientId, { $push: { projects: project._id } })

  const populatedProject = await ConstructionProject.findById(project._id).populate("clientId", "clientName email")

  res.status(201).json(populatedProject)
})

// @desc    Update construction project
// @route   PUT /api/construction/sales/projects/:id
// @access  Private
const updateConstructionProject = asyncHandler(async (req, res) => {
  const project = await ConstructionProject.findById(req.params.id)

  if (!project) {
    res.status(404)
    throw new Error("Construction project not found")
  }

  const updatedProject = await ConstructionProject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("clientId", "clientName email")
    .populate("workOrders")

  res.json(updatedProject)
})

// @desc    Delete construction project
// @route   DELETE /api/construction/sales/projects/:id
// @access  Private
const deleteConstructionProject = asyncHandler(async (req, res) => {
  const project = await ConstructionProject.findById(req.params.id)

  if (!project) {
    res.status(404)
    throw new Error("Construction project not found")
  }

  // Remove project from construction client's projects array
  await ConstructionClient.findByIdAndUpdate(project.clientId, { $pull: { projects: req.params.id } })

  // Delete associated construction work orders
  await ConstructionWorkOrder.deleteMany({ projectId: req.params.id })

  await ConstructionProject.findByIdAndDelete(req.params.id)

  res.json({ message: "Construction project and associated work orders deleted successfully" })
})

// @desc    Get construction projects by client
// @route   GET /api/construction/sales/projects/client/:clientId
// @access  Private
const getConstructionProjectsByClient = asyncHandler(async (req, res) => {
  const projects = await ConstructionProject.find({ clientId: req.params.clientId })
    .populate("workOrders")
    .sort({ createdAt: -1 })

  res.json(projects)
})

// @desc    Get construction project statistics
// @route   GET /api/construction/sales/projects/stats
// @access  Private
const getConstructionProjectStats = asyncHandler(async (req, res) => {
  const totalProjects = await ConstructionProject.countDocuments()
  const activeProjects = await ConstructionProject.countDocuments({ status: "Active" })
  const completedProjects = await ConstructionProject.countDocuments({ status: "Completed" })
  const inProgressProjects = await ConstructionProject.countDocuments({ status: "In Progress" })

  const totalBudget = await ConstructionProject.aggregate([{ $group: { _id: null, total: { $sum: "$budget" } } }])

  res.json({
    totalProjects,
    activeProjects,
    completedProjects,
    inProgressProjects,
    totalBudget: totalBudget[0]?.total || 0,
  })
})

module.exports = {
  getConstructionProjects,
  getConstructionProject,
  createConstructionProject,
  updateConstructionProject,
  deleteConstructionProject,
  getConstructionProjectsByClient,
  getConstructionProjectStats,
}
