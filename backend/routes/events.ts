import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../lib/db.ts";
import { authenticate } from "../middleware/auth.ts";
import { broadcast } from "../lib/socket.ts";

const router = express.Router();

function tfidfScore(userInterests: string, event: any): number {
  const interests = userInterests.toLowerCase().split(/[\s,]+/);
  const eventText = `${event.title} ${event.description} ${event.category}`.toLowerCase();
  let score = 0;
  for (const word of interests) {
    if (word.length > 2 && eventText.includes(word)) score++;
  }
  return score;
}

router.get("/", (req, res) => {
  const events = db.prepare("SELECT * FROM events ORDER BY start_time ASC").all();
  res.json(events);
});

router.get("/my-registrations", authenticate, (req: any, res) => {
  const regs = db.prepare(`
    SELECT e.*, r.registered_at, r.payment_id as payment_status 
    FROM registrations r JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ? ORDER BY e.start_time ASC
  `).all(req.user.id);
  res.json(regs);
});

router.get("/recommendations", authenticate, async (req: any, res) => {
  try {
    const user = db.prepare("SELECT interests FROM users WHERE id = ?").get(req.user.id) as any;
    const events = db.prepare("SELECT * FROM events").all() as any[];
    const interests = user?.interests || "Technology Design Coding Hackathon";
    const scored = events
      .map(e => ({ ...e, score: tfidfScore(interests, e) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    res.json(scored);
  } catch (e) {
    res.json([]);
  }
});

router.post("/", authenticate, (req: any, res) => {
  if (req.user.role !== "admin" && req.body.verified) {
    return res.status(403).json({ error: "Only admins can create verified events" });
  }
  const { title, description, start_time, end_time, type, verified, category, price } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO events (id, title, description, start_time, end_time, type, verified, category, price, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description, start_time, end_time, type || "personal", verified ? 1 : 0, category, Number(price) || 0, req.user.id);

  const newEvent = { id, title, description, start_time, end_time, type, verified: verified ? 1 : 0, category, price: Number(price) || 0 };
  broadcast({ type: "EVENT_CREATED", event: newEvent });
  res.json(newEvent);
});

router.post("/:id/register", authenticate, (req: any, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id) as any;
  if (!event) return res.status(404).json({ error: "Event not found" });
  try {
    db.prepare("INSERT OR IGNORE INTO registrations (user_id, event_id, payment_id) VALUES (?, ?, ?)")
      .run(req.user.id, req.params.id, "free");
    res.json({ success: true, requiresPayment: event.price > 0 });
  } catch (e) {
    res.status(500).json({ error: "Registration failed" });
  }
});

export default router;