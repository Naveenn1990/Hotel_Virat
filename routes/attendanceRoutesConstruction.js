const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getAllAttendance,
    updateAttendance
} = require('../controller/attendanceControllerConstruction');

router.post('/', markAttendance);
router.get('/', getAllAttendance);
router.put('/:id', updateAttendance);

module.exports = router;
