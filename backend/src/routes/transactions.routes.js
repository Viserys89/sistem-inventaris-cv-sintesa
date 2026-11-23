import express from "express";

import {
  getTransactions,
  getTransactionSummary,
  getTransactionById,
  createIncomingTransaction,
  createOutgoingTransaction,
  createStockAdjustment
} from "../controllers/transactions.controller.js";

import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/summary", getTransactionSummary);
router.get("/:id", getTransactionById);
router.get("/", getTransactions);
router.post("/incoming", createIncomingTransaction);
router.post("/outgoing", createOutgoingTransaction);
router.post("/adjustment", createStockAdjustment);

export default router;