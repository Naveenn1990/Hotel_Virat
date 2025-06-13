const express = require('express');
const router = express.Router();
const {
    createPayslip,
    getPayslips
} = require('../controller/payslipController');

router.post('/', createPayslip);
router.get('/', getPayslips);

module.exports = router;
