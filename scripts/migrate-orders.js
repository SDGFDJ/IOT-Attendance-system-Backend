import mongoose from 'mongoose';
import OrderModel from '../models/order.model.js';

// Connect to MongoDB
mongoose.connect('mongodb+srv://gaurav8830930:8830930200@wintopclasse.1jsdmkz.mongodb.net/?retryWrites=true&w=majority&appName=WintopClasse', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  migrateOrders();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

async function migrateOrders() {
  try {
    const orders = await OrderModel.find({}).lean();

    for (const order of orders) {
      if (!Array.isArray(order.product_details)) {
        const updatedProductDetails = [{
          productId: order.productId || null,
          name: order.product_details?.name || 'Unknown Product',
          image: order.product_details?.image || [],
          quantity: order.quantity || 1,
          subTotalAmt: order.subTotalAmt || 0
        }];

        await OrderModel.updateOne(
          { _id: order._id },
          {
            $set: {
              product_details: updatedProductDetails,
              totalAmt: order.totalAmt || order.subTotalAmt || 0
            },
            $unset: {
              productId: "",
              quantity: "",
              subTotalAmt: ""
            }
          }
        );
        console.log(`Updated order ${order.orderId}`);
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}