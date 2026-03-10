import express from "express";
import { authenticate } from "../middleware/auth.ts";
import db from "../lib/db.ts";
import Razorpay from 'razorpay';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SPZ4iRp78qA5IG',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '3ANcxyxr2FgcqJwY0fFXpDkY'
});

router.post("/create-order", authenticate, async (req: any, res) => {
  const { amount, event_id } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${event_id}_${Date.now()}`,
    });
    console.log('Real order created:', order.id);
    res.json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (e: any) {
    console.error('Razorpay order error:', JSON.stringify(e));
    res.status(500).json({ error: e?.error?.description || 'Order creation failed' });
  }
});

router.post("/create-link", authenticate, async (req: any, res) => {
  res.json({ short_url: null }); // unused now
});

router.post("/verify", authenticate, (req: any, res) => {
  const { event_id, payment_id } = req.body;
  if (event_id) {
    try {
      db.prepare(`UPDATE registrations SET payment_id = ? WHERE user_id = ? AND event_id = ?`)
        .run(payment_id || 'paid', req.user.id, event_id);
    } catch (e) {}
  }
  res.json({ success: true });
});

export default router;