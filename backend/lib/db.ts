import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('events.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'student',
    interests TEXT,
    google_tokens TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    start_time DATETIME,
    end_time DATETIME,
    type TEXT,
    verified INTEGER DEFAULT 0,
    category TEXT,
    price REAL DEFAULT 0,
    creator_id TEXT,
    FOREIGN KEY(creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    priority TEXT,
    due_date DATETIME,
    category TEXT,
    completed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    folder TEXT DEFAULT 'General',
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    day TEXT,
    period INTEGER,
    subject TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS od_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    event_id TEXT,
    hours REAL,
    date DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS forum_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT,
    user_id TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    event_id TEXT,
    payment_id TEXT,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id)
  );
  
`);
// Add missing columns if they don't exist
try { db.exec("ALTER TABLE tasks ADD COLUMN completed INTEGER DEFAULT 0"); } catch(e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'pending'"); } catch(e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN folder TEXT DEFAULT 'General'"); } catch(e) {}

const adminExists = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@admin.com");
if (!adminExists) {
  db.prepare("INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)")
    .run(randomUUID(), "admin@admin.com", "Admin", "admin");
}

const eventCount = db.prepare("SELECT COUNT(*) as count FROM events").get() as any;
if (eventCount.count === 0) {
  const mockEvents = [
    { id: 'evt-college-001', title: 'Annual Tech Symposium 2026', description: 'The biggest tech event of the year featuring keynotes, workshops and networking.', start_time: '2026-03-15T09:00:00', end_time: '2026-03-15T17:00:00', type: 'college', verified: 1, category: 'Technology', price: 0 },
    { id: 'evt-hackathon-002', title: 'Hackathon: Build for Future', description: '48-hour coding marathon. Build solutions for real-world problems.', start_time: '2026-03-20T10:00:00', end_time: '2026-03-22T10:00:00', type: 'club', verified: 1, category: 'Coding', price: 200 },
    { id: 'evt-photo-003', title: 'Photography Workshop', description: 'Learn the art of capturing moments with professional photographers.', start_time: '2026-03-18T14:00:00', end_time: '2026-03-18T16:00:00', type: 'club', verified: 1, category: 'Arts', price: 50 },
  ];
  const ins = db.prepare(`INSERT INTO events (id, title, description, start_time, end_time, type, verified, category, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  mockEvents.forEach(e => ins.run(e.id, e.title, e.description, e.start_time, e.end_time, e.type, e.verified, e.category, e.price));
}

export default db;