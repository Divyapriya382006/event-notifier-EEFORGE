const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ─── In-memory DB (swap for SQLite/Postgres easily) ──────────────────────────
let events = [
  { id: 1, title: "Team Standup", date: "2026-03-10", time: "09:00", category: "work", notify: true, note: "Daily sync" },
  { id: 2, title: "Dentist Appointment", date: "2026-03-12", time: "14:30", category: "health", notify: true, note: "" },
  { id: 3, title: "Lunch w/ Sara", date: "2026-03-15", time: "12:00", category: "social", notify: false, note: "Thai place on 5th" },
];
let nextId = 4;
// ─────────────────────────────────────────────────────────────────────────────

app.get("/events", (req, res) => {
  const sorted = [...events].sort(
    (a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
  );
  res.json(sorted);
});

app.post("/events", (req, res) => {
  const { title, date, time, category, notify, note } = req.body;
  if (!title || !date || !time)
    return res.status(400).json({ error: "title, date, and time are required" });
  const event = { id: nextId++, title, date, time, category: category || "other", notify: !!notify, note: note || "" };
  events.push(event);
  res.status(201).json(event);
});

app.patch("/events/:id/notify", (req, res) => {
  const event = events.find((e) => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).json({ error: "Not found" });
  event.notify = !event.notify;
  res.json(event);
});

app.delete("/events/:id", (req, res) => {
  const idx = events.findIndex((e) => e.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  events.splice(idx, 1);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`notifi backend running on http://localhost:${PORT}`));
