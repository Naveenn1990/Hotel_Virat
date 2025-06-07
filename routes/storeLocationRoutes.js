const express = require("express");
const router = express.Router();
const storeLocationController = require("../controller/storeLocationController");

router.post("/", storeLocationController.createStoreLocation);

router.get("/", storeLocationController.getAllStoreLocations);

router.get("/:id", storeLocationController.getStoreLocationById);

router.put("/:id", storeLocationController.updateStoreLocation);


router.delete("/:id", storeLocationController.deleteStoreLocation);

module.exports = router;