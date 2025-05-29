const Branch = require('../model/Branch');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

const createBranch = asyncHandler(async (req, res) => {
  if (!req.body) {
    res.status(400);
    throw new Error('Request body is missing');
  }

  const { name, address } = req.body;
  const image = req.file ? req.file.path : null;

  if (!name || !address) {
    res.status(400);
    throw new Error('Name and address are required');
  }

  const branch = new Branch({ name, address, image });
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
  if (!req.body) {
    res.status(400);
    throw new Error('Request body is missing');
  }

  const { name, address } = req.body;
  const updateData = { name, address };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => 
    updateData[key] === undefined && delete updateData[key]
  );

  // If a new image is uploaded, update the image path and delete the old image
  if (req.file) {
    updateData.image = req.file.path;

    // Find the branch to get the old image path
    const branch = await Branch.findById(req.params.id);
    if (branch && branch.image) {
      fs.unlink(path.join(__dirname, '..', branch.image), (err) => {
        if (err) console.error('Error deleting old image:', err);
      });
    }
  }

  const updatedBranch = await Branch.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedBranch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  res.json(updatedBranch);
});

const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  // Delete the associated image file
  if (branch.image) {
    fs.unlink(path.join(__dirname, '..', branch.image), (err) => {
      if (err) console.error('Error deleting image:', err);
    });
  }

  await Branch.deleteOne({ _id: req.params.id });
  res.json({ message: 'Branch removed successfully' });
});

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};