# ⚡ EventPulse

> **A full-stack college event management platform** — built for students and admins to discover, register, and manage campus events in real time.

![EventPulse Banner](https://picsum.photos/seed/eventpulse/1200/400)

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

> App runs on `http://localhost:5173` by default.

**Default Admin Login:**
- Email: `admin@eventpulse.com` or `admin`
- Any name

---

## 📋 Table of Contents

- [Features Overview](#-features-overview)
- [Special Features](#-special-features)
  - [Google Calendar Sync](#-google-calendar-sync)
  - [Event Forum](#-event-forum)
  - [Timetable Manager](#-timetable-manager)
  - [OD Tracker](#-od-tracker)
  - [Razorpay Payments](#-razorpay-payment-integration)
  - [WebSocket & Real-Time](#-websocket--real-time-broadcasting)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Roles & Permissions](#-roles--permissions)

---

## ✨ Features Overview

| Feature | Description |
|---|---|
| 🗓️ Event Discovery | Browse, search, and filter all campus events |
| 📝 Event Registration | Register for free or paid events |
| ✅ Verified Events | Admin-verified college & club events |
| 📊 Dashboard | Live stats — upcoming events, OD hours, task progress |
| ✅ Task Manager | Priority-based task tracker with Google Calendar sync |
| 🏆 Portfolio | Personal profile tracking registered & completed events |
| 💬 Forum | Real-time event-specific chat channels |
| 🕐 Timetable | Weekly class schedule with CSV/image upload |
| ⏱️ OD Tracker | On-Duty hours calculator with visual progress bar |
| 💳 Payments | Razorpay-powered paid event registration |
| 🔔 Notifications | Live push notifications for new events via WebSocket |
| 👑 Admin Panel | Create verified events, manage the platform |

---

## 🌟 Special Features

### 📅 Google Calendar Sync

EventPulse integrates directly with **Google Calendar** — no OAuth required, zero friction.

**How it works:**
- After registering for an event, a one-click **"Add to Google Calendar"** button appears on the event details modal
- Creating a new task **automatically opens Google Calendar** pre-filled with the task title, due date, priority, and category
- Each task row has a 📅 hover button to manually sync any task at any time

**What gets synced:**
```
Events  → Title, description, start/end time, location (Main Campus)
Tasks   → "[Task] Title", due date as all-day block, priority + category in notes
```

All calendar links are generated using the **Google Calendar URL API** (`calendar.google.com/render?action=TEMPLATE`), making them universally compatible without any API keys.

---

### 💬 Event Forum

A **Slack-style real-time chat** built into every verified event.

- Each verified event gets its own **dedicated channel** (`#event-name`)
- **All users** (students and admins) can post messages
- **Admin messages** are visually distinguished with a purple badge
- Messages from the current user appear on the right; others on the left (chat bubble style)
- Powered by **WebSocket** — messages appear instantly across all connected clients with no refresh needed
- Message history is persisted and loaded on channel select

```
Forum channels are auto-created for every event marked as "Verified"
```

---

### 🗓️ Timetable Manager

A full **weekly class schedule grid** modelled after university timetable formats.

**Features:**
- Displays **Theory** and **Lab** rows separately for each day (MON–SUN)
- 14 time slots from `08:00` to `18:30` with a dedicated Lunch break column
- **Click any cell** to edit the subject inline via a prompt
- Subjects are auto-classified as Theory or Lab based on naming patterns (`LAB`, `LO`, `L1`, etc.)
- Color-coded: 🟡 Yellow for theory, 🟢 Green for labs, 🟠 Orange for lunch

**Upload Options:**

| Method | Format | Notes |
|---|---|---|
| CSV Upload | `Day,Period,Subject` | e.g. `MON,1,A1-BCSE302L-TH-AB3-206-ALL` |
| Image Upload | Any image format | OCR-ready (auto-extract in production) |

```csv
# Example CSV format
Day,Period,Subject
MON,1,BCSE302L-TH
MON,3,BCSE401L-LAB
TUE,2,BCSE310L-TH
```

---

### ⏱️ OD Tracker

Tracks **On-Duty hours** earned from attending registered events, enforcing a **40-hour semester limit**.

**Logic:**
- ✅ **Used Hours** — calculated only from registered events whose `end_time` is in the past (truly completed)
- 🔵 **Pending Hours** — upcoming/ongoing registered events (not yet credited)
- 🟠 **Remaining** — `40h - usedHours`

**Visual Bar:**
```
[████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░]
 ↑ Solid = Completed OD    ↑ Faded = Pending
```

- Each event caps at **8 hours** maximum per day regardless of actual duration
- Events are listed in two groups: **OD Credited** (green `+Xh` badge) and **Pending OD** (blue badge)
- Dashboard stat card shows live OD hours synced with the tracker

---

### 💳 Razorpay Payment Integration

Paid events use **Razorpay** for secure in-app payment processing.

**Flow:**
```
Register → Create Order (backend) → Razorpay Checkout Modal → Verify Payment → Confirm Registration
```

1. Clicking **Register Now** on a paid event triggers registration via `/api/events/:id/register`
2. If payment is required, a Razorpay order is created via `/api/payments/create-order`
3. The **Razorpay checkout modal** opens with event title, amount in INR, and branding
4. On success, payment is verified server-side via `/api/payments/verify`
5. Registration status updates to `paid` and a confirmation banner appears

```javascript
// Razorpay config used
{
  key: 'rzp_test_SPZ4iRp78qA5IG',  // Replace with live key for production
  currency: 'INR',
  theme: { color: '#141414' }
}
```

> ⚠️ Currently using **test mode**. Replace the Razorpay key with a live key before deploying to production.

---

### 🔌 WebSocket & Real-Time Broadcasting

EventPulse uses **native WebSockets** for real-time features across two systems:

#### 1. Live Event Notifications
When an admin creates a new event, **all connected clients** instantly receive it:

```
Server broadcasts → { type: 'EVENT_CREATED', event: {...} }
  ↓
All clients → Event added to list + Bell notification with title
```

- The notification bell shows an unread count badge
- Clicking it opens a dropdown with all recent notifications and timestamps
- "Clear all" dismisses the batch

#### 2. Forum Real-Time Messaging
Each forum channel maintains a live WebSocket connection:

```
User sends message → POST /api/forum/:eventId
Server broadcasts → { type: 'FORUM_MESSAGE', message: {...} }
  ↓
All clients in that channel → Message appears instantly
```

- Duplicate message prevention via ID deduplication
- Auto-scroll to latest message
- Connection is scoped per selected event channel and cleaned up on unmount

**WebSocket Connection:**
```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);
```
> Automatically uses `wss://` in production (HTTPS) and `ws://` in development.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion (`motion/react`) |
| Icons | Lucide React |
| Real-Time | Native WebSocket API |
| Payments | Razorpay JS SDK |
| Calendar | Google Calendar URL API |
| Backend | Node.js (Express-compatible) |
| Database | SQLite (via `/api` routes) |
| Dev Server | Vite (`npm run dev`) |

---

## 📁 Project Structure

```
eventpulse/
├── src/
│   ├── App.tsx                  # Main app, routing, auth, WebSocket setup
│   ├── components/
│   │   └── Layout.tsx           # Sidebar navigation + layout wrapper
│   └── ...
├── server/
│   ├── index.ts                 # Express server + WebSocket server
│   ├── routes/
│   │   ├── auth.ts              # Login / logout / session
│   │   ├── events.ts            # CRUD + registration + recommendations
│   │   ├── tasks.ts             # Task CRUD + toggle complete
│   │   ├── payments.ts          # Razorpay order creation + verification
│   │   ├── forum.ts             # Forum messages per event
│   │   ├── timetable.ts         # Weekly schedule CRUD + CSV upload
│   │   └── od.ts                # OD hours calculation
│   └── db.ts                    # SQLite schema + seed data
├── public/
├── package.json
└── vite.config.ts
```

---

## 🔗 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login or register user |
| `POST` | `/api/auth/logout` | End session |
| `GET` | `/api/auth/me` | Get current session user |

### Events
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events` | List all events |
| `POST` | `/api/events` | Create event (admin: verified) |
| `POST` | `/api/events/:id/register` | Register for event |
| `GET` | `/api/events/my-registrations` | Get user's registered events |
| `GET` | `/api/events/recommendations` | AI-recommended events |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | Get user's tasks |
| `POST` | `/api/tasks` | Create task |
| `PATCH` | `/api/tasks/:id` | Toggle complete / update |
| `DELETE` | `/api/tasks/:id` | Delete task |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/payments/create-order` | Create Razorpay order |
| `POST` | `/api/payments/verify` | Verify payment signature |

### Forum
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/forum/:eventId` | Get messages for event channel |
| `POST` | `/api/forum/:eventId` | Post message to channel |

### Timetable
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/timetable` | Get user's timetable |
| `POST` | `/api/timetable` | Add/update single cell |
| `POST` | `/api/timetable/upload` | Bulk upload via CSV |

### OD
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/od/calculate` | Get total OD hours used |

---

## 👥 Roles & Permissions

| Action | Student | Admin |
|---|---|---|
| Browse & search events | ✅ | ✅ |
| Register for events | ✅ | ✅ |
| Create personal events | ✅ | ✅ |
| Create verified events | ❌ | ✅ |
| Post in forum | ✅ | ✅ *(Admin badge)* |
| Manage timetable | ✅ | ✅ |
| Track OD hours | ✅ | ✅ |
| Broadcast to all users | ❌ | ✅ *(via event creation)* |

---

## 📸 Screenshots

| Dashboard | Events | Forum |
|---|---|---|
| ![Dashboard](https://picsum.photos/seed/dash/400/250) | ![Events](https://picsum.photos/seed/evts/400/250) | ![Forum](https://picsum.photos/seed/forum/400/250) |

| Timetable | OD Tracker | Portfolio |
|---|---|---|
| ![Timetable](https://picsum.photos/seed/tt/400/250) | ![OD](https://picsum.photos/seed/od/400/250) | ![Portfolio](https://picsum.photos/seed/port/400/250) |

---

## 📄 License

MIT © EventPulse

---

<div align="center">
  <sub>Built with ⚡ for college communities</sub>
</div>
