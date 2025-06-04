const mongoose = require('mongoose');
const Expense = require("../model/Expense")

const expenseSchema = new mongoose.Schema({
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now
    },
    voucherNumber: {
        type: String,
        default: ''
    },
    receipt: {
        name: String,
        size: Number,
        data: String
    },
    frequency: {
        type: String,
        enum: ['one-time', 'daily', 'weekly', 'monthly'],
        default: 'one-time'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add virtual property for formatted date
expenseSchema.virtual('formattedDate').get(function () {
    return this.date.toISOString().split('T')[0];
});

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const { branch, type, amount, description, date, voucherNumber, receipt, frequency } = req.body
    if (!branch || !type || !amount) return res.status(400).json({ message: "Branch, type, and amount are required" })
    const expense = new Expense({
      branch,
      type,
      amount,
      description,
      date: date ? new Date(date) : undefined,
      voucherNumber,
      receipt,
      frequency,
    })
    await expense.save()
    res.status(201).json(expense)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get all expenses (optionally filter by branch)
exports.getExpenses = async (req, res) => {
  try {
    const { branch } = req.query
    const filter = branch ? { branch } : {}
    const expenses = await Expense.find(filter).sort({ date: -1 })
    res.json(expenses)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params
    await Expense.findByIdAndDelete(id)
    res.json({ message: "Expense deleted" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = mongoose.model('Expense', expenseSchema);