const express = require('express');
const router = express.Router();
const grnController = require('../controller/grnController');

router.post('/', grnController.createGRN);
router.put('/:id/qc', grnController.updateQCStatus);

module.exports = router;