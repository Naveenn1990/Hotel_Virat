const express = require('express');
const router = express.Router();
const poController = require('../controller/poController');

router.get('/', poController.getPOs);
router.post('/', poController.createPO);
router.put('/:id/approve', poController.approvePO);
router.put('/:id/reject', poController.rejectPO);

module.exports = router;