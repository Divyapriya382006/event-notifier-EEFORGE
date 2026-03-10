import express from "express";
import db from "../lib/db.ts";
import { authenticate } from "../middleware/auth.ts";
import { broadcast } from "../lib/socket.ts";

const router = express.Router();

router.get("/:eventId", (req, res) => {
  const messages = db.prepare(`
    SELECT fm.*, u.name as user_name, u.role as user_role
    FROM forum_messages fm
    JOIN users u ON fm.user_id = u.id
    WHERE fm.event_id = ?
    ORDER BY fm.timestamp ASC
  `).all(req.params.eventId);
  res.json(messages);
});

router.post("/:eventId", authenticate, (req: any, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message required" });

  const result = db.prepare(`
    INSERT INTO forum_messages (event_id, user_id, message)
    VALUES (?, ?, ?)
  `).run(req.params.eventId, req.user.id, message);

  const newMessage = {
    id: result.lastInsertRowid,
    event_id: req.params.eventId,
    user_id: req.user.id,
    message,
    timestamp: new Date().toISOString(),
    user_name: req.user.name,
    user_role: req.user.role
  };

  broadcast({ type: "FORUM_MESSAGE", message: newMessage });
  res.json(newMessage);
});

export default router;