const express = require('express');
const router = express.Router();
const siteController = require('../controller/siteController');

router.get('/', siteController.getSites);
router.post('/', siteController.createSite);
router.put('/:id', siteController.updateSite);
router.delete('/:id', siteController.deleteSite);

module.exports = router;
