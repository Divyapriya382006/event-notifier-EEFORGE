import express from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import db from "../lib/db.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "hackathon-secret-key";

router.post("/login", (req, res) => {
  const { email, name } = req.body;
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user) {
    const id = uuidv4();
    db.prepare("INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)").run(id, email, name, 'student');
    user = { id, email, name, role: 'student' };
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json(user);
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

export default router;
