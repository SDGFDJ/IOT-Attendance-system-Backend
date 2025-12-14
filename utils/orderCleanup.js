import cron from 'node-cron';
import OrderModel from '../models/order.model.js'; // path correct karo according to your project

// ---------------- Auto-delete cancelled orders older than 1 hour ----------------
export const setupOrderCleanup = () => {
  cron.schedule('0 * * * *', async () => { // every hour
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      const result = await OrderModel.deleteMany({
        payment_status: "CANCELLED",
        updatedAt: { $lte: oneHourAgo } // cancelled before 1 hour
      });

      if (result.deletedCount > 0) {
        console.log(`Deleted ${result.deletedCount} cancelled orders older than 1 hour`);
      }
    } catch (error) {
      console.error("Error deleting cancelled orders:", error);
    }
  });
};
