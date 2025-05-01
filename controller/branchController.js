const Branch = require('../model/Branch');
const asyncHandler = require('express-async-handler');


const createBranch = asyncHandler(async (req, res) => {
  const { name, address } = req.body;

  if (!name || !address) {
    res.status(400);
    throw new Error('Name and address are required');
  }

  const branch = new Branch({ name, address });
  const createdBranch = await branch.save();

  res.status(201).json(createdBranch);
});


const getBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find({});
  res.json(branches);
});


const getBranchById = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);

  if (branch) {
    res.json(branch);
  } else {
    res.status(404);
    throw new Error('Branch not found');
  }
});


const updateBranch = asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  const branch = await Branch.findById(req.params.id);

  if (branch) {
    branch.name = name || branch.name;
    branch.address = address || branch.address;
    const updatedBranch = await branch.save();
    res.json(updatedBranch);
  } else {
    res.status(404);
    throw new Error('Branch not found');
  }
});


const deleteBranch = asyncHandler(async (req, res) => {
    const branch = await Branch.findById(req.params.id);
  
    if (!branch) {
      res.status(404);
      throw new Error('Branch not found');
    }
  
    await Branch.deleteOne({ _id: req.params.id }); // Changed from branch.remove()
    res.json({ message: 'Branch removed successfully' });
  });

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};