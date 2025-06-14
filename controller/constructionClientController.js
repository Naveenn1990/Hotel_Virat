const ConstructionClient = require("../model/ConstructionClient")
const ConstructionProject = require("../model/ConstructionProject")
const asyncHandler = require("express-async-handler")

// @desc    Get all construction clients
// @route   GET /api/construction/sales/clients
// @access  Private
const getConstructionClients = asyncHandler(async (req, res) => {
  const clients = await ConstructionClient.find({}).populate("projects").sort({ createdAt: -1 })
  res.json(clients)
})

// @desc    Get single construction client
// @route   GET /api/construction/sales/clients/:id
// @access  Private
const getConstructionClient = asyncHandler(async (req, res) => {
  const client = await ConstructionClient.findById(req.params.id).populate("projects")

  if (!client) {
    res.status(404)
    throw new Error("Construction client not found")
  }

  res.json(client)
})

// @desc    Create new construction client
// @route   POST /api/construction/sales/clients
// @access  Private
const createConstructionClient = asyncHandler(async (req, res) => {
  const { clientName, gstin, billingAddress, contactPerson, email, phone, state } = req.body

  // Check if construction client already exists
  const clientExists = await ConstructionClient.findOne({
    $or: [{ email }, { gstin: gstin && gstin.trim() !== "" ? gstin : null }].filter(Boolean),
  })

  if (clientExists) {
    res.status(400)
    throw new Error("Construction client with this email or GSTIN already exists")
  }

  const client = await ConstructionClient.create({
    clientName,
    gstin,
    billingAddress,
    contactPerson,
    email,
    phone,
    state,
  })

  res.status(201).json(client)
})

// @desc    Update construction client
// @route   PUT /api/construction/sales/clients/:id
// @access  Private
const updateConstructionClient = asyncHandler(async (req, res) => {
  const client = await ConstructionClient.findById(req.params.id)

  if (!client) {
    res.status(404)
    throw new Error("Construction client not found")
  }

  const updatedClient = await ConstructionClient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("projects")

  res.json(updatedClient)
})

// @desc    Delete construction client
// @route   DELETE /api/construction/sales/clients/:id
// @access  Private
const deleteConstructionClient = asyncHandler(async (req, res) => {
  const client = await ConstructionClient.findById(req.params.id)

  if (!client) {
    res.status(404)
    throw new Error("Construction client not found")
  }

  // Delete associated construction projects
  await ConstructionProject.deleteMany({ clientId: req.params.id })

  await ConstructionClient.findByIdAndDelete(req.params.id)

  res.json({ message: "Construction client and associated projects deleted successfully" })
})

// @desc    Get construction client statistics
// @route   GET /api/construction/sales/clients/stats
// @access  Private
const getConstructionClientStats = asyncHandler(async (req, res) => {
  const totalClients = await ConstructionClient.countDocuments()
  const activeClients = await ConstructionClient.countDocuments({ status: "Active" })
  const clientsWithProjects = await ConstructionClient.countDocuments({
    projects: { $exists: true, $not: { $size: 0 } },
  })

  res.json({
    totalClients,
    activeClients,
    clientsWithProjects,
    inactiveClients: totalClients - activeClients,
  })
})

module.exports = {
  getConstructionClients,
  getConstructionClient,
  createConstructionClient,
  updateConstructionClient,
  deleteConstructionClient,
  getConstructionClientStats,
}
