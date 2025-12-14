import { Router } from 'express';
import auth from '../middleware/auth.js';
import { authAdminMiddleware } from '../middleware/authAdminMiddleware.js';
import {
  CashOnDeliveryOrderController,
  getOrderDetailsController,
  cancelOrderController,
  getAllOrdersController,
  paymentController,
  webhookStripe,
  updateOrderStatusController
} from '../controllers/order.controller.js';

const orderRouter = Router();

// Customer routes
orderRouter.post("/cash-on-delivery", auth, CashOnDeliveryOrderController);
orderRouter.post('/checkout', auth, paymentController);
orderRouter.post('/webhook', webhookStripe);
orderRouter.post("/cancel", auth, cancelOrderController);
orderRouter.get("/order-list", auth, getOrderDetailsController);

// Admin routes
orderRouter.get("/admin/orders", authAdminMiddleware, getAllOrdersController);
orderRouter.post("/admin/update-status", authAdminMiddleware, updateOrderStatusController);

export default orderRouter;