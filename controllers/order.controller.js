import Stripe from "../config/stripe.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import AddressModel from "../models/address.model.js";

const generateOrderId = () => {
  return "ORD-" + Math.floor(10000000 + Math.random() * 90000000);
};

export const priceWithDiscount = (price, dis = 0) => {
  const discountAmount = Math.ceil((Number(price) * Number(dis)) / 100);
  return Number(price) - discountAmount;
};

// ===================== CASH ON DELIVERY =====================
export async function CashOnDeliveryOrderController(req, res) {
  try {
    const userId = req.userId;
    const { list_items, address } = req.body;

    if (!list_items || list_items.length === 0)
      return res.status(400).json({ success: false, message: "No items in order" });

    if (!address || Object.keys(address).length === 0)
      return res.status(400).json({ success: false, message: "Delivery address is required" });

    const deliveryAddress = {
      name: address.name || "Unknown",
      building: address.building || "",
      street: address.address_line || "",
      district: address.district || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "",
      postalCode: address.pincode || "",
      mobile: address.mobile || ""
    };

    // ✅ सही price calculation
    const productDetails = list_items.map(el => {
      const price = priceWithDiscount(el.productId?.price || 0, el.productId?.discount || 0);
      const quantity = el.quantity || 1;
      return {
        productId: el.productId?._id || null,
        name: el.productId?.name || "Unknown Product",
        image: el.productId?.image || [],
        quantity,
        price,
        subTotalAmt: Number(price * quantity).toFixed(2),
      };
    });

    const totalAmt = Number(
      productDetails.reduce((sum, item) => sum + Number(item.subTotalAmt), 0).toFixed(2)
    );

    const order = {
      userId,
      orderId: generateOrderId(),
      product_details: productDetails,
      paymentId: "",
      payment_status: "CASH ON DELIVERY",
      delivery_address: deliveryAddress,
      totalAmt,
      statusHistory: [{ status: "PLACED", updatedAt: new Date() }],
      createdAt: new Date()
    };

    const generatedOrder = await OrderModel.create(order);

    await CartProductModel.deleteMany({ userId });
    await UserModel.updateOne({ _id: userId }, { shopping_cart: [] });

    const io = req.app.get("io");
    io.emit("new-order", {
      orderId: generatedOrder.orderId,
      userName: userId,
      totalAmt
    });

    return res.json({
      message: "Order placed successfully",
      error: false,
      success: true,
      data: generatedOrder
    });

  } catch (error) {
    console.error("CashOnDeliveryOrderController Error:", error);
    return res.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

// ===================== STRIPE PAYMENT =====================
export async function paymentController(req, res) {
  try {
    const userId = req.userId;
    const { list_items, addressId } = req.body;

    if (!list_items || list_items.length === 0)
      return res.status(400).json({ success: false, message: "No items to pay for" });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const address = await AddressModel.findById(addressId);
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    const line_items = list_items.map(item => {
      const price = priceWithDiscount(item.productId?.price || 0, item.productId?.discount || 0);
      return {
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.productId?.name || "Unknown Product",
            images: item.productId?.image || [],
            metadata: { productId: item.productId?._id || "" }
          },
          unit_amount: Math.round(price * 100), // ✅ per unit price in paise
        },
        adjustable_quantity: { enabled: true, minimum: 1 },
        quantity: item.quantity || 1
      };
    });

    const params = {
      submit_type: 'pay',
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      metadata: { userId, addressId },
      line_items,
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`
    };

    const session = await Stripe.checkout.sessions.create(params);
    return res.status(200).json(session);

  } catch (error) {
    return res.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

// ===================== STRIPE WEBHOOK =====================
export async function webhookStripe(req, res) {
  try {
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const addressId = session.metadata?.addressId;

      if (!userId) return res.status(400).json({ success: false, message: "UserId missing" });

      const address = await AddressModel.findById(addressId);
      const lineItems = await Stripe.checkout.sessions.listLineItems(session.id);

      const productDetails = [];
      if (lineItems?.data?.length) {
        for (const item of lineItems.data) {
          const product = await Stripe.products.retrieve(item.price.product);
          const unitPrice = item.amount_subtotal / item.quantity / 100;
          productDetails.push({
            productId: product.metadata?.productId || null,
            name: product.name || "Unknown Product",
            image: product.images || [],
            quantity: item.quantity || 1,
            price: unitPrice,
            subTotalAmt: Number(unitPrice * (item.quantity || 1)).toFixed(2)
          });
        }
      }

      const order = {
        userId,
        orderId: generateOrderId(),
        product_details: productDetails,
        paymentId: session.payment_intent,
        payment_status: "PAID",
        delivery_address: address ? {
          name: address.name || "Unknown",
          building: address.building || "",
          street: address.address_line || "",
          district: address.district || "",
          city: address.city || "",
          state: address.state || "",
          country: address.country || "",
          postalCode: address.pincode || "",
          mobile: address.mobile || "",
        } : {},
        totalAmt: Number(productDetails.reduce((sum, item) => sum + Number(item.subTotalAmt), 0).toFixed(2)),
        statusHistory: [{ status: "PAID", updatedAt: new Date() }],
        createdAt: new Date()
      };

      await OrderModel.create(order);
      await UserModel.findByIdAndUpdate(userId, { shopping_cart: [] });
      await CartProductModel.deleteMany({ userId });
    }

    res.json({ received: true });

  } catch (error) {
    console.error("Stripe Webhook Error:", error);
    res.status(500).json({ success: false, message: error.message || "Webhook error" });
  }
}

export async function getOrderDetailsController(req, res) {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let orderlist;
    if (user.role === "ADMIN") {
      orderlist = await OrderModel.find().sort({ createdAt: -1 }).populate('userId', 'name email mobile').lean();
    } else {
      orderlist = await OrderModel.find({ 
        userId: user._id, 
        payment_status: { $nin: ["CANCELLED", "COMPLETED"] } 
      }).sort({ createdAt: -1 }).lean();
    }

    orderlist = orderlist.map(order => ({
      ...order,
      product_details: Array.isArray(order.product_details) ? order.product_details : [order.product_details].filter(Boolean),
      orderTimeFormatted: new Date(order.createdAt).toLocaleString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    }));

    return res.json({ message: "Order list", data: orderlist, error: false, success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export const cancelOrderController = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "Order ID is required" });

    const user = await UserModel.findById(req.userId);
    const order = await OrderModel.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (user.role !== "USER" && order.userId.toString() !== req.userId)
      return res.status(403).json({ success: false, message: "Unauthorized to cancel this order" });

    order.payment_status = "CANCELLED";
    order.statusHistory.push({ status: "CANCELLED", updatedAt: new Date() });
    await order.save();

    setTimeout(async () => {
      await OrderModel.deleteOne({ _id: order._id });
      console.log(`Order ${order.orderId} permanently deleted after 10 minutes.`);
    }, 10 * 60 * 1000);

    res.status(200).json({ success: true, message: "Order cancelled successfully (will delete after 10 min)", order });

  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
};

export const updateOrderStatusController = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const user = await UserModel.findById(req.userId);
    if (!user || user.role !== "ADMIN")
      return res.status(403).json({ success: false, message: "Unauthorized" });

    const order = await OrderModel.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.statusHistory.push({ status, updatedAt: new Date() });
    if (status === "DELIVERED") order.payment_status = "COMPLETED";
    if (status === "CANCELLED") order.payment_status = "CANCELLED";

    await order.save();

    if (status === "CANCELLED") {
      setTimeout(async () => {
        await OrderModel.deleteOne({ _id: order._id });
        console.log(`Order ${order.orderId} permanently deleted after 10 minutes.`);
      }, 10 * 60 * 1000);
    }

    res.json({ success: true, message: `Order status updated to ${status}`, data: order });

  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
};

export async function getAllOrdersController(req, res) {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user || user.role !== "ADMIN")
      return res.status(403).json({ success: false, message: "Unauthorized" });

    const orders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email mobile')
      .lean();

    const formattedOrders = orders.map(order => ({
      ...order,
      product_details: Array.isArray(order.product_details) ? order.product_details : [order.product_details].filter(Boolean),
      delivery_address: order.delivery_address || {},
      customerName: order.delivery_address?.name || order.userId?.name || "Unknown",
      customerMobile: order.delivery_address?.mobile || order.userId?.mobile || "N/A",
      formattedAddress: `${order.delivery_address?.name || ""}, ${order.delivery_address?.building || ""}, ${order.delivery_address?.street || ""}, ${order.delivery_address?.district || ""}, ${order.delivery_address?.city || ""}, ${order.delivery_address?.postalCode || ""}, ${order.delivery_address?.state || ""}, ${order.delivery_address?.country || ""}`
    }));

    return res.json({ success: true, data: formattedOrders });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};