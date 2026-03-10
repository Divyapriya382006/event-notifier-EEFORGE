import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../lib/db.ts";
import { authenticate } from "../middleware/auth.ts";

const router = express.Router();

router.get("/", authenticate, (req: any, res) => {
  const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ?").all(req.user.id);
  res.json(tasks);
});

router.post("/", authenticate, (req: any, res) => {
  const { title, priority, due_date, category } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO tasks (id, title, priority, due_date, category, user_id, completed, status, folder)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', 'General')
    `).run(id, title, priority || 'Medium', due_date, category || 'General', req.user.id);
    res.json({ id, title, priority: priority || 'Medium', due_date, category: category || 'General', completed: 0 });
  } catch (e: any) {
    console.error('Task error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.patch("/:id", authenticate, (req: any, res) => {
  const { completed } = req.body;
  db.prepare("UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?")
    .run(completed ? 1 : 0, req.params.id, req.user.id);
  res.json({ success: true });
});

router.delete("/:id", authenticate, (req: any, res) => {
  db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  res.json({ success: true });
});

export default router;
