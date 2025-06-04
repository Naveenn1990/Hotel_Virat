const Expense = require("../model/Expense");

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
    try {
        const { branch, type, amount, description, date, voucherNumber, frequency } = req.body;

        const expense = new Expense({
            branch,
            type,
            amount,
            description,
            date: date || new Date(),
            voucherNumber,
            frequency,
            receipt: req.file ? {
                name: req.file.originalname,
                size: req.file.size,
                data: req.file.buffer.toString('base64')
            } : null
        });

        const savedExpense = await expense.save();
        res.status(201).json({
            success: true,
            data: savedExpense
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
    try {
        const { branch, period, type } = req.query;
        let query = {};

        if (branch) query.branch = branch;
        if (type) query.type = type;

        // Date filtering
        if (period) {
            const now = new Date();
            const startDate = new Date(now);

            switch (period) {
                case 'daily':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'weekly':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'monthly':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
            }

            query.date = { $gte: startDate };
        }

        const expenses = await Expense.find(query)
            .sort({ date: -1 })
            .populate('branch', 'name location');

        res.status(200).json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                error: 'No expense found'
            });
        }

        await expense.remove();
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats
// @access  Private
exports.getExpenseStats = async (req, res) => {
    try {
        const { branch, period } = req.query;
        let match = {};

        if (branch) match.branch = mongoose.Types.ObjectId(branch);

        if (period) {
            const now = new Date();
            const startDate = new Date(now);

            switch (period) {
                case 'daily': startDate.setHours(0, 0, 0, 0); break;
                case 'weekly': startDate.setDate(now.getDate() - 7); break;
                case 'monthly': startDate.setMonth(now.getMonth() - 1); break;
            }

            match.date = { $gte: startDate };
        }

        const stats = await Expense.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};