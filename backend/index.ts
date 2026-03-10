import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import db from "./lib/db.ts";
import { v4 as uuidv4 } from "uuid";

import authRoutes from "./routes/auth.ts";
import eventRoutes from "./routes/events.ts";
import paymentRoutes from "./routes/payments.ts";
import taskRoutes from "./routes/tasks.ts";
import forumRoutes from "./routes/forum.ts";
import { authenticate } from "./middleware/auth.ts";

import { addClient, removeClient } from "./lib/socket.ts";

const JWT_SECRET = process.env.JWT_SECRET || "hackathon-secret-key";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());
  app.use(cookieParser());

  // WebSocket handling
  wss.on("connection", (ws) => {
    addClient(ws);
    ws.on("close", () => removeClient(ws));
  });

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/forum", forumRoutes);

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  // Timetable Routes
  app.get("/api/timetable", authenticate, (req: any, res) => {
    const tt = db.prepare("SELECT * FROM timetable WHERE user_id = ?").all(req.user.id);
    res.json(tt);
  });

  app.post("/api/timetable", authenticate, (req: any, res) => {
    const { day, period, subject } = req.body;
    db.prepare("INSERT INTO timetable (user_id, day, period, subject) VALUES (?, ?, ?, ?)").run(req.user.id, day, period, subject);
    res.json({ success: true });
  });

  // OD Calculator Logic
  app.get("/api/od/calculate", authenticate, (req: any, res) => {
    const userId = req.user.id;
    // Mock calculation: count events during class hours
    const events = db.prepare(`
      SELECT e.* FROM events e
      JOIN od_records od ON e.id = od.event_id
      WHERE od.user_id = ?
    `).all(userId);
    
    const totalHours = events.reduce((acc: number, e: any) => {
      const start = new Date(e.start_time).getTime();
      const end = new Date(e.end_time).getTime();
      return acc + (end - start) / (1000 * 60 * 60);
    }, 0);

    res.json({ totalHours, limit: 40 }); // Example limit
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("frontend/dist"));
  }

  server.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer();
