import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  building: { type: String },
  street: { type: String },
  district: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postalCode: { type: String },
  mobile: { type: String }
}, { _id: false });

const productDetailSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.ObjectId, ref: "Product", required: false },
  name: { type: String, required: true, default: "Unknown Product" },
  image: { type: [String], default: [] },
  quantity: { type: Number, default: 1 },
  subTotalAmt: { type: Number, default: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  orderId: {
    type: String,
    required: [true, "Provide orderId"],
    unique: true
  },
  product_details: {
    type: [productDetailSchema],
    required: true,
    default: []
  },
  paymentId: { type: String, default: "" },
  payment_status: { type: String, default: "" },
  delivery_address: {
    type: addressSchema,
    required: true
  },
  totalAmt: { type: Number, default: 0 },
  statusHistory: {
    type: [statusHistorySchema],
    default: [{ status: "PLACED", updatedAt: Date.now() }]
  }
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const lastOrder = await this.constructor.findOne({}).sort({ createdAt: -1 });
    let newId = 10000000;
    if (lastOrder && lastOrder.orderId) {
      const lastNumeric = parseInt(lastOrder.orderId.replace('ORD-', ''), 10);
      if (!isNaN(lastNumeric)) newId = lastNumeric + 1;
    }
    this.orderId = `ORD-${newId}`;
  }
  // Ensure product_details is always an array
  if (!Array.isArray(this.product_details)) {
    this.product_details = [this.product_details].filter(Boolean);
  }
  next();
});

orderSchema.virtual("orderTimeFormatted").get(function() {
  return new Date(this.createdAt).toLocaleString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
});

orderSchema.set('toObject', { virtuals: true });
orderSchema.set('toJSON', { virtuals: true });

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;