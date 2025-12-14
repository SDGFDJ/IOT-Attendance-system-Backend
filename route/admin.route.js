import express from "express";
import OrderModel from "../models/order.model.js";
import { adminAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/admin/update-status", adminAuth, async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await OrderModel.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.statusHistory.push({ status });

    if (status === "CANCELLED") order.payment_status = "CANCELLED";
    else order.payment_status = status === "DELIVERED" ? "COMPLETED" : "PENDING";

    await order.save();

    res.status(200).json({ success: true, message: "Order status updated", data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
