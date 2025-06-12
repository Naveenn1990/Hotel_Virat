const express = require('express');
const router = express.Router();
const ReportController = require('../controller/reportController');

router.get('/', ReportController.getReports);
router.get('/:id', ReportController.getReportById);
router.post('/', ReportController.createReport);
router.put('/:id', ReportController.updateReport);
router.delete('/:id', ReportController.deleteReport);
router.get('/:id/download', ReportController.downloadReport);

module.exports = router;