const Expense = require('../model/supervisorExpense');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/receipts/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed'));
        }
    }
}).single('receipt');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const { status, category, startDate, endDate } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (category) {
            query.category = category;
        }

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const expenses = await Expense.find(query)
            .sort({ date: -1 })
            .populate('submittedBy', 'name email')
            .populate('project', 'name');

        res.json(expenses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const { amount, description, category, date, vendor } = req.body;

            let receiptPath = 'No receipt';
            if (req.file) {
                receiptPath = req.file.path;
            }

            const expense = new Expense({
                amount,
                description,
                category,
                date: date || Date.now(),
                vendor,
                receipt: receiptPath,
                submittedBy: req.user.id, // Assuming you have user authentication
                project: req.project.id // Assuming project context
            });

            const createdExpense = await expense.save();
            res.status(201).json(createdExpense);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server Error' });
        }
    });
};

// @desc    Update expense status
// @route   PUT /api/expenses/:id/status
// @access  Private/Admin
const updateExpenseStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        expense.status = status;
        const updatedExpense = await expense.save();

        res.json(updatedExpense);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('submittedBy', 'name email')
            .populate('project', 'name');

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(expense);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get expenses statistics
// @route   GET /api/expenses/stats
// @access  Private
const getExpenseStats = async (req, res) => {
    try {
        const stats = await Expense.aggregate([
            {
                $match: {
                    project: mongoose.Types.ObjectId(req.project.id) // Filter by current project
                }
            },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: "$amount" },
                    pendingExpenses: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0]
                        }
                    },
                    approvedExpenses: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "approved"] }, "$amount", 0]
                        }
                    },
                    rejectedExpenses: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "rejected"] }, "$amount", 0]
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalExpenses: 1,
                    pendingExpenses: 1,
                    approvedExpenses: 1,
                    rejectedExpenses: 1,
                    count: 1
                }
            }
        ]);

        const categoryStats = await Expense.aggregate([
            {
                $match: {
                    project: mongoose.Types.ObjectId(req.project.id)
                }
            },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);

        res.json({
            summary: stats[0] || {
                totalExpenses: 0,
                pendingExpenses: 0,
                approvedExpenses: 0,
                rejectedExpenses: 0,
                count: 0
            },
            byCategory: categoryStats
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getExpenses,
    createExpense,
    updateExpenseStatus,
    getExpenseById,
    getExpenseStats
};