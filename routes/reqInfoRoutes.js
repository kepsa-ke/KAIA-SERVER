const express = require("express");
const router = express.Router();
const {
  createReq,
  getAllRequest,
  fetchSpecifiRequest,
  permanentlyDeleteRequest,
  toggleHandling,
} = require("../controllers/reqInfoController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/", createReq);
router.get("/", protect, getAllRequest);
router.get("/:id", protect, fetchSpecifiRequest);
router.delete("/:id", protect, permanentlyDeleteRequest);
router.patch("/:id/toggle-status", toggleHandling);

module.exports = router;
