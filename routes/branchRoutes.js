const express = require('express');
const router = express.Router();

const { createBranch, getBranches, getBranchById, updateBranch, deleteBranch } = require('../controller/branchController');

router.route('/')
  .post(createBranch)
  .get(getBranches);

router.route('/:id')
  .get(getBranchById)
  .put(updateBranch)
  .delete(deleteBranch);

module.exports = router;