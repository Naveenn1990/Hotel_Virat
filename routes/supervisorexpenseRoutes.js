const express = require('express');
const router = express.Router();
const {
    getExpenses,
    createExpense,
    updateExpenseStatus,
    getExpenseById,
    getExpenseStats
} = require('../controller/supervisorexpenseController');


router.route('/getall')
    .get(getExpenses)
    .post(createExpense);

router.route('/stats')
    .get(getExpenseStats);

router.route('/:id')
    .get(getExpenseById);

router.route('/:id/status')
    .put(updateExpenseStatus);

module.exports = router;