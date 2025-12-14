import express from 'express';
import Subscription from "../models/Subscription.js";
import webpush from "../utils/webpush.js";
const router = express.Router();

// 1. Public VAPID Key भेजना
router.get("/vapidPublicKey", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// 2. Subscription Save करना
router.post("/subscribe", async (req, res) => {
  try {
    const subscription = new Subscription(req.body);
    await subscription.save();
    res.status(201).json({ message: "Subscription saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Notification भेजना
router.post("/send", async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    const payload = JSON.stringify({
      title: "New Order!",
      body: req.body.message || "You have a new order.",
    });

    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((err) => console.error(err));
    });

    res.json({ message: "Notifications sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;