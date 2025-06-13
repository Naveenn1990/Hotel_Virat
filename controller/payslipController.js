const Payslip = require('../model/Payslip');

exports.createPayslip = async (req, res) => {
    try {
        const payslip = new Payslip(req.body);
        await payslip.save();
        res.status(201).json(payslip);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getPayslips = async (req, res) => {
    const payslips = await Payslip.find().populate({
        path: 'payrollId',
        populate: { path: 'employeeId' }
    });
    res.json(payslips);
};
