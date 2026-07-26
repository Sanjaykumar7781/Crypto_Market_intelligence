import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/authMiddleware.js";
import { chatWithAi } from "../controllers/chatController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  asyncHandler(chatWithAi)
);

export default router;