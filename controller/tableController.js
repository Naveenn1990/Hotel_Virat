const Table = require('../model/Table');
const Branch = require('../model/Branch');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

const createTable = asyncHandler(async (req, res) => {
  if (!req.body) {
    res.status(400);
    throw new Error('Request body is missing');
  }

  const { branchId, number, status } = req.body;
  const image = req.file ? req.file.path : null;

  if (!branchId || !number) {
    res.status(400);
    throw new Error('Branch ID and number are required');
  }

  const branch = await Branch.findById(branchId);
  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  const table = new Table({ branchId, number, status, image });
  const createdTable = await table.save();

  res.status(201).json(createdTable);
});

const getTables = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const query = branchId ? { branchId } : {};
  const tables = await Table.find(query).populate('branchId', 'name');
  res.json(tables);
});

const getTableById = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id).populate('branchId', 'name');

  if (table) {
    res.json(table);
  } else {
    res.status(404);
    throw new Error('Table not found');
  }
});

const updateTable = asyncHandler(async (req, res) => {
  if (!req.body) {
    res.status(400);
    throw new Error('Request body is missing');
  }

  const { branchId, number, status } = req.body;
  const updateData = { branchId, number, status };

  Object.keys(updateData).forEach(key => 
    updateData[key] === undefined && delete updateData[key]
  );

  if (req.file) {
    updateData.image = req.file.path;

    const table = await Table.findById(req.params.id);
    if (table && table.image) {
      fs.unlink(path.join(__dirname, '..', table.image), (err) => {
        if (err) console.error('Error deleting old image:', err);
      });
    }
  }

  if (updateData.branchId) {
    const branch = await Branch.findById(updateData.branchId);
    if (!branch) {
      res.status(404);
      throw new Error('Branch not found');
    }
  }

  const updatedTable = await Table.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate('branchId', 'name');

  if (!updatedTable) {
    res.status(404);
    throw new Error('Table not found');
  }

  res.json(updatedTable);
});

const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);

  if (!table) {
    res.status(404);
    throw new Error('Table not found');
  }

  if (table.image) {
    fs.unlink(path.join(__dirname, '..', table.image), (err) => {
      if (err) console.error('Error deleting image:', err);
    });
  }

  await Table.deleteOne({ _id: req.params.id });
  res.json({ message: 'Table removed successfully' });
});

module.exports = {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable,
};