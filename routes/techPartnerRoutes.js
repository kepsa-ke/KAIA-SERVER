const express = require("express");
const router = express.Router();
const {
  createPartner,
  getAllPartners,
  updateSpecificPartner,
  permanentlyDeletePartner,
} = require("../controllers/techPartnerController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/", protect, createPartner);
router.get("/", getAllPartners);
router.put("/:id", protect, updateSpecificPartner);
router.delete("/:id", protect, permanentlyDeletePartner);

module.exports = router;
