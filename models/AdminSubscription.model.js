import mongoose from "mongoose";

const AdminSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  }
}, { timestamps: true });

const AdminSubscriptionModel = mongoose.model("AdminSubscription", AdminSubscriptionSchema);

export default AdminSubscriptionModel;
