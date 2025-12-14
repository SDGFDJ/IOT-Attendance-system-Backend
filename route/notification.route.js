import express from "express";
import webpush from "../utils/webpush.js";

const router = express.Router();

// Public VAPID Key भेजने का API
router.get("/vapidPublicKey", (req, res) => {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY,
  });
});

export default router;
