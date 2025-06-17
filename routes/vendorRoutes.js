const express = require('express');
const router = express.Router();
const vendorController = require('../controller/vendorController');

router.get('/getall', vendorController.getVendors);
router.post('/', vendorController.addVendor);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;