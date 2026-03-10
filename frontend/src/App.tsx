import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, Grid, List, Calendar as CalendarIcon,
  Clock, CheckCircle2, TrendingUp, Award, Zap, X,
  Send, Upload, RefreshCw, Star, Bell, User,
  LogOut
} from 'lucide-react';

interface Event {
  id: string; title: string; description: string;
  start_time: string; end_time: string;
  type: 'college' | 'club' | 'personal';
  verified: boolean | number; category: string; price: number;
  payment_status?: string; registered_at?: string;
}
interface User { id: string; email: string; name: string; role: 'admin' | 'student'; }

// ---- Shared Google Calendar helpers ----
const addEventToGoogleCalendar = (event: Event) => {
  const start = new Date(event.start_time).toISOString().replace(/-|:|\.\d{3}/g, '');
  const end = new Date(event.end_time).toISOString().replace(/-|:|\.\d{3}/g, '');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${start}/${end}` +
    `&details=${encodeURIComponent(event.description || '')}` +
    `&location=${encodeURIComponent('Main Campus')}`;
  window.open(url, '_blank');
};

const addTaskToGoogleCalendar = (task: any) => {
  const due = new Date(task.due_date);
  const dateStr = due.toISOString().slice(0, 10).replace(/-/g, '');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent('[Task] ' + task.title)}` +
    `&dates=${dateStr}T090000/${dateStr}T100000` +
    `&details=${encodeURIComponent('Priority: ' + (task.priority || '') + '\nCategory: ' + (task.category || ''))}`;
  window.open(url, '_blank');
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    const name = (e.target as any).name.value;
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    const data = await res.json();
    setUser(data);
    loadAll();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null); setEvents([]); setRegisteredEvents([]); setTasks([]);
  };

  const loadAll = () => {
    fetch('/api/events').then(r => r.ok ? r.json() : []).then(d => setEvents(Array.isArray(d) ? d : [])).catch(() => setEvents([]));
    fetch('/api/events/my-registrations').then(r => r.ok ? r.json() : []).then(d => setRegisteredEvents(Array.isArray(d) ? d : [])).catch(() => setRegisteredEvents([]));
    fetch('/api/tasks').then(r => r.ok ? r.json() : []).then(d => setTasks(Array.isArray(d) ? d : [])).catch(() => setTasks([]));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) { const data = await res.json(); setUser(data); loadAll(); }
      } catch (e) {}
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'EVENT_CREATED') {
        setEvents(prev => {
          const current = Array.isArray(prev) ? prev : [];
          if (current.some(e => e.id === data.event.id)) return current;
          return [...current, data.event];
        });
        setNotifications(prev => [...prev, { id: Date.now(), text: `New event: ${data.event.title}`, time: new Date().toLocaleTimeString() }]);
      }
    };
    return () => ws.close();
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#E4E3E0] text-2xl font-serif italic">Loading EventPulse...</div>;

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#E4E3E0] p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif italic font-bold mb-2">EventPulse</h1>
            <p className="text-sm text-[#141414]/60 uppercase tracking-widest">Sign in to your account</p>
          </div>
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-xs text-blue-800">
            <strong>Admin:</strong> email = <code>admin@eventpulse.com</code> or <code>admin</code>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Full Name</label>
              <input name="name" required className="w-full border border-[#141414] p-3 focus:outline-none focus:bg-[#141414]/5" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Email Address</label>
              <input name="email" type="text" required className="w-full border border-[#141414] p-3 focus:outline-none focus:bg-[#141414]/5" placeholder="john@college.edu" />
            </div>
            <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors">
              Enter Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0]">
      <div className="fixed top-0 right-0 z-40 flex items-center gap-2 p-4">
        <div className="relative">
          <button onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            className="relative bg-white border border-[#141414] p-2 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:bg-[#141414]/5">
            <Bell size={18} />
            {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{notifications.length}</span>}
          </button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <div className="p-3 border-b border-[#141414] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest">Notifications</span>
                  {notifications.length > 0 && <button onClick={() => setNotifications([])} className="text-[10px] underline opacity-50">Clear all</button>}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0
                    ? <div className="p-4 text-center text-xs opacity-30 italic">No notifications</div>
                    : notifications.map((n: any) => (
                      <div key={n.id} className="p-3 border-b border-[#141414]/10 text-sm">
                        <p className="font-medium">{n.text}</p>
                        <p className="text-[10px] opacity-40 mt-1">{n.time}</p>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="bg-[#141414] text-white p-2 flex items-center gap-2 px-3">
            <span className="text-xs font-bold">{user.name[0].toUpperCase()}</span>
            <span className="text-xs hidden md:block">{user.name.split(' ')[0]}</span>
          </button>
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                <div className="p-4 border-b border-[#141414]">
                  <p className="font-bold text-sm">{user.name}</p>
                  <p className="text-[10px] opacity-50 uppercase">{user.role} • {user.email}</p>
                </div>
                <div className="p-2">
                  <button onClick={() => { setActiveTab('portfolio'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-[#141414]/5 flex items-center gap-2"><User size={14} /> My Portfolio</button>
                  <button onClick={() => { setActiveTab('timetable'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-[#141414]/5 flex items-center gap-2"><CalendarIcon size={14} /> My Timetable</button>
                  <button onClick={() => { setActiveTab('od'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-[#141414]/5 flex items-center gap-2"><Clock size={14} /> OD Tracker</button>
                  <hr className="my-2 border-[#141414]/10" />
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><LogOut size={14} /> Logout</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}>
        {activeTab === 'dashboard' && <Dashboard events={events} setActiveTab={setActiveTab} user={user} registeredEvents={registeredEvents} tasks={tasks} />}
        {activeTab === 'events' && <EventsView events={events} setEvents={setEvents} viewMode={viewMode} setViewMode={setViewMode} setShowCreateModal={setShowCreateModal} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterCategory={filterCategory} setFilterCategory={setFilterCategory} setSelectedEvent={setSelectedEvent} registeredEvents={registeredEvents} setRegisteredEvents={setRegisteredEvents} user={user} />}
        {activeTab === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} setShowTaskModal={setShowTaskModal} />}
        {activeTab === 'od' && <ODCalculator registeredEvents={registeredEvents} />}
        {activeTab === 'timetable' && <Timetable />}
        {activeTab === 'portfolio' && <Portfolio events={events} registeredEvents={registeredEvents} tasks={tasks} user={user} />}
        {activeTab === 'verified-clg' && <VerifiedEventsView events={events} type="college" user={user} setShowCreateModal={setShowCreateModal} setSelectedEvent={setSelectedEvent} registeredEvents={registeredEvents} setRegisteredEvents={setRegisteredEvents} />}
        {activeTab === 'verified-club' && <VerifiedEventsView events={events} type="club" user={user} setShowCreateModal={setShowCreateModal} setSelectedEvent={setSelectedEvent} registeredEvents={registeredEvents} setRegisteredEvents={setRegisteredEvents} />}
        {activeTab === 'forum' && <ForumView events={events} user={user} />}

        <CreateEventModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} user={user} setEvents={setEvents} />
        <AddTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} setTasks={setTasks} />
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} registeredEvents={registeredEvents} setRegisteredEvents={setRegisteredEvents} />
      </Layout>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-[#141414] w-full max-w-lg shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[#141414] flex items-center justify-between">
          <h3 className="text-xl font-serif italic font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#141414]/5"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </motion.div>
    </div>
  );
}

function CreateEventModal({ isOpen, onClose, user, setEvents }: any) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    const res = await fetch('/api/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, verified: user.role === 'admin' && data.verified === 'on', price: Number(data.price) || 0 })
    });
    if (res.ok) {
      const newEvent = await res.json();
      setEvents((prev: Event[]) => {
        if (prev.some(e => e.id === newEvent.id)) return prev;
        return [...prev, newEvent];
      });
      onClose();
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Title</label><input name="title" required className="w-full border border-[#141414] p-2 text-sm" /></div>
        <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Description</label><textarea name="description" required className="w-full border border-[#141414] p-2 text-sm h-20" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Start Time</label><input name="start_time" type="datetime-local" required className="w-full border border-[#141414] p-2 text-sm" /></div>
          <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">End Time</label><input name="end_time" type="datetime-local" required className="w-full border border-[#141414] p-2 text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Category</label>
            <select name="category" className="w-full border border-[#141414] p-2 text-sm">
              <option>Technology</option><option>Arts</option><option>Sports</option><option>Coding</option><option>Workshop</option><option>Design</option>
            </select></div>
          <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Type</label>
            <select name="type" className="w-full border border-[#141414] p-2 text-sm">
              <option value="college">College</option><option value="club">Club</option><option value="personal">Personal</option>
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Price (₹)</label><input name="price" type="number" defaultValue="0" min="0" className="w-full border border-[#141414] p-2 text-sm" /></div>
          {user.role === 'admin' && (
            <div className="flex items-center gap-2 pt-6"><input name="verified" type="checkbox" id="verified" className="w-4 h-4" /><label htmlFor="verified" className="text-[10px] uppercase tracking-widest font-bold">Mark as Verified</label></div>
          )}
        </div>
        <button type="submit" className="w-full bg-[#141414] text-white py-3 font-bold uppercase tracking-widest mt-4">Create Event</button>
      </form>
    </Modal>
  );
}

function AddTaskModal({ isOpen, onClose, setTasks }: any) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const newTask = await res.json();
      setTasks((prev: any[]) => [...(Array.isArray(prev) ? prev : []), newTask]);
      (e.target as HTMLFormElement).reset();
      onClose();
      // Auto-open Google Calendar with task details pre-filled
      addTaskToGoogleCalendar(newTask);
    } else {
      alert('Failed to add task.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Task Title</label><input name="title" required className="w-full border border-[#141414] p-2 text-sm" placeholder="Enter task title..." /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Priority</label>
            <select name="priority" className="w-full border border-[#141414] p-2 text-sm"><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div>
          <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Category</label>
            <select name="category" className="w-full border border-[#141414] p-2 text-sm"><option>General</option><option>Academic</option><option>Club</option><option>Personal</option></select></div>
        </div>
        <div><label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Due Date</label><input name="due_date" type="date" required className="w-full border border-[#141414] p-2 text-sm" /></div>
        <p className="text-[10px] text-[#141414]/40 italic">📅 Google Calendar will open automatically after adding</p>
        <button type="submit" className="w-full bg-[#141414] text-white py-3 font-bold uppercase tracking-widest">Add Task</button>
      </form>
    </Modal>
  );
}

function EventDetailsModal({ event, onClose, registeredEvents, setRegisteredEvents }: any) {
  const [registering, setRegistering] = useState(false);
  const [paid, setPaid] = useState(false);
  const isRegistered = registeredEvents.some((r: Event) => r.id === event?.id);

  useEffect(() => { setPaid(false); setRegistering(false); }, [event?.id]);
  if (!event) return null;

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!data.success) { alert(data.error || 'Registration failed'); setRegistering(false); return; }

      if (event.price > 0 && data.requiresPayment) {
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: event.price, event_id: event.id })
        });
        const order = await orderRes.json();
        if (order.error) { alert('Payment setup failed: ' + order.error); setRegistering(false); return; }

        const options = {
          key: 'rzp_test_SPZ4iRp78qA5IG',
          amount: event.price * 100,
          currency: 'INR',
          name: 'EventPulse',
          description: `Registration: ${event.title}`,
          order_id: order.id,
          handler: async (response: any) => {
            await fetch('/api/payments/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event_id: event.id, payment_id: response.razorpay_payment_id })
            });
            setPaid(true);
            setRegisteredEvents((prev: Event[]) =>
              prev.map((r: Event) => r.id === event.id ? { ...r, payment_status: 'paid' } : r)
            );
          },
          prefill: { name: '', email: '' },
          theme: { color: '#141414' }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setRegisteredEvents((prev: Event[]) => {
          if (prev.some(r => r.id === event.id)) return prev;
          return [...prev, { ...event, payment_status: 'pending' }];
        });
      } else {
        setRegisteredEvents((prev: Event[]) => {
          if (prev.some(r => r.id === event.id)) return prev;
          return [...prev, { ...event, payment_status: 'free' }];
        });
      }
    } catch (e) {
      alert('Registration failed. Please try again.');
    }
    setRegistering(false);
  };

  return (
    <Modal isOpen={!!event} onClose={onClose} title="Event Details">
      <div className="space-y-6">
        <div className="h-40 overflow-hidden">
          <img src={`https://picsum.photos/seed/${event.id}/800/400`} className="w-full h-full object-cover grayscale" alt="" referrerPolicy="no-referrer" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-2xl font-serif italic font-bold">{event.title}</h3>
            {event.verified && <CheckCircle2 size={20} className="text-blue-600" />}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-[#141414] text-white px-2 py-1 text-[10px] font-bold uppercase">{event.category}</span>
            <span className="border border-[#141414] px-2 py-1 text-[10px] font-bold uppercase">{event.type}</span>
          </div>
          <p className="text-sm text-[#141414]/70">{event.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#141414]/10">
          <div><p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Start</p><p className="text-xs font-bold mt-1">{new Date(event.start_time).toLocaleString()}</p></div>
          <div><p className="text-[10px] uppercase tracking-widest font-bold opacity-40">End</p><p className="text-xs font-bold mt-1">{new Date(event.end_time).toLocaleString()}</p></div>
        </div>

        {/* Registered state: show confirmation + Google Calendar button */}
        {(isRegistered || paid) && (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 border border-green-300 text-center text-sm font-bold text-green-800">
              {paid ? '✅ Payment confirmed! Registered.' : '✅ You are registered!'}
            </div>
            <button
              onClick={() => addEventToGoogleCalendar(event)}
              className="w-full border border-[#4285F4] text-[#4285F4] py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
              <RefreshCw size={13} /> Add to Google Calendar
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Fee</p>
            <p className="text-xl font-mono font-bold">{event.price > 0 ? `₹${event.price}` : 'FREE'}</p>
          </div>
          {!isRegistered && !paid && (
            <button onClick={handleRegister} disabled={registering}
              className="bg-[#141414] text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-[#141414]/90 disabled:opacity-50">
              {registering ? 'Registering...' : 'Register Now'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Dashboard({ events, setActiveTab, user, registeredEvents, tasks }: any) {
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [localReg, setLocalReg] = useState<Event[]>(registeredEvents);
  useEffect(() => { setLocalReg(registeredEvents); }, [registeredEvents]);
  useEffect(() => {
    fetch('/api/events/recommendations').then(r => r.ok ? r.json() : []).then(d => setRecommendations(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const now = new Date();
  const taskList = Array.isArray(tasks) ? tasks : [];
  const eventList = Array.isArray(events) ? events : [];
  const regList = Array.isArray(registeredEvents) ? registeredEvents : [];

  // Upcoming = events not yet started
  const upcoming = eventList.filter((e: Event) => new Date(e.start_time) > now);

  // OD hours from completed registered events only
  const completedRegEvents = regList.filter((e: Event) => new Date(e.end_time) < now);
  const odHours = completedRegEvents.reduce((acc: number, e: Event) =>
    acc + Math.min((new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000, 8), 0);

  // Tasks
  const completedTasks = taskList.filter((t: any) => t.completed);
  const taskPct = taskList.length > 0 ? Math.round((completedTasks.length / taskList.length) * 100) : 0;

  const stats = [
    { label: 'Upcoming Events', value: upcoming.length, icon: CalendarIcon, color: 'text-blue-600' },
    { label: 'Registered', value: regList.length, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'OD Hours Used', value: `${odHours.toFixed(1)}h`, icon: TrendingUp, color: 'text-orange-600' },
    { label: 'Tasks Done', value: `${completedTasks.length}/${taskList.length}`, icon: Award, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white border border-[#141414] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <stat.icon className={stat.color} size={22} />
            <h3 className="text-3xl font-mono font-bold mt-3">{stat.value}</h3>
            <p className="text-[10px] opacity-60 uppercase tracking-wider mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>
      {taskList.length > 0 && (
        <div className="bg-white border border-[#141414] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest">Task Productivity</span>
            <span className="text-sm font-mono font-bold">{completedTasks.length}/{taskList.length}</span>
          </div>
          <div className="h-2 bg-[#141414]/10">
            <motion.div initial={{ width: 0 }} animate={{ width: `${taskPct}%` }} className="h-full bg-[#141414]" />
          </div>
          <p className="text-[10px] opacity-40 mt-1">{taskPct}% complete</p>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-serif italic font-bold flex items-center gap-2"><Star size={18} className="text-yellow-500" /> Recommended for You</h3>
          <button onClick={() => setActiveTab('events')} className="text-xs uppercase tracking-widest font-bold underline">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(recommendations.length > 0 ? recommendations : eventList).slice(0, 4).map((event: Event) => (
            <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
          ))}
        </div>
      </div>
      <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} registeredEvents={localReg} setRegisteredEvents={setLocalReg} />
    </div>
  );
}

function EventsView({ events, setEvents, viewMode, setViewMode, setShowCreateModal, searchQuery, setSearchQuery, filterCategory, setFilterCategory, setSelectedEvent, registeredEvents, setRegisteredEvents, user }: any) {
  const filteredEvents = events.filter((e: Event) => {
    const q = searchQuery.toLowerCase();
    return (e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)) && (filterCategory === 'All' || e.category === filterCategory);
  });
  const categories = ['All', ...Array.from(new Set<string>(events.map((e: Event) => e.category)))];
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border border-[#141414] pl-10 pr-4 py-2 text-sm focus:outline-none" placeholder="Search events..." />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border border-[#141414]">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-[#141414] text-white' : ''}`}><Grid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 border-l border-[#141414] ${viewMode === 'list' ? 'bg-[#141414] text-white' : ''}`}><List size={18} /></button>
          </div>
          <div className="relative group">
            <button className="flex items-center gap-2 border border-[#141414] px-4 py-2 text-sm font-bold uppercase"><Filter size={16} />{filterCategory}</button>
            <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-[#141414] shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-10">
              {categories.map((cat: string) => <button key={cat} onClick={() => setFilterCategory(cat)} className="w-full text-left px-4 py-2 text-xs hover:bg-[#141414]/5 uppercase font-bold">{cat}</button>)}
            </div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="bg-[#141414] text-white px-4 py-2 text-sm font-bold uppercase flex items-center gap-2">
            <Plus size={16} />{user.role === 'admin' ? 'Create Event' : 'Add Event'}
          </button>
        </div>
      </div>
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
        {filteredEvents.map((event: Event) => viewMode === 'grid'
          ? <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
          : <EventRow key={event.id} event={event} onClick={() => setSelectedEvent(event)} />)}
        {filteredEvents.length === 0 && <div className="col-span-full py-20 text-center border-2 border-dashed border-[#141414]/10"><p className="font-serif italic opacity-30">No events found</p></div>}
      </div>
    </div>
  );
}

function EventCard({ event, onClick }: { event: Event, onClick?: () => void }) {
  return (
    <motion.div whileHover={{ y: -4 }} onClick={onClick} className="bg-white border border-[#141414] overflow-hidden group cursor-pointer">
      <div className="h-36 relative overflow-hidden">
        <img src={`https://picsum.photos/seed/${event.id}/800/400`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={event.title} referrerPolicy="no-referrer" />
        {event.verified && <div className="absolute top-2 left-2 bg-white border border-[#141414] px-2 py-1 flex items-center gap-1"><CheckCircle2 size={12} className="text-blue-600" /><span className="text-[10px] font-bold">Verified</span></div>}
        <div className="absolute top-2 right-2 bg-[#141414] text-white px-2 py-1 text-[10px] font-bold uppercase">{event.category}</div>
      </div>
      <div className="p-4">
        <h4 className="text-base font-serif italic font-bold mb-2 group-hover:underline">{event.title}</h4>
        <div className="flex items-center gap-2 text-xs opacity-60 mb-3"><Clock size={13} /><span>{new Date(event.start_time).toLocaleDateString()}</span></div>
        <div className="flex items-center justify-between pt-3 border-t border-[#141414]/10">
          <span className="text-sm font-mono font-bold">{event.price > 0 ? `₹${event.price}` : 'FREE'}</span>
          <button className="text-[10px] font-bold uppercase border border-[#141414] px-3 py-1 hover:bg-[#141414] hover:text-white transition-colors">Register</button>
        </div>
      </div>
    </motion.div>
  );
}

function EventRow({ event, onClick }: { event: Event, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white border border-[#141414] p-4 flex items-center gap-4 hover:bg-[#141414]/5 cursor-pointer">
      <div className="w-14 h-14 flex-shrink-0 overflow-hidden"><img src={`https://picsum.photos/seed/${event.id}/100/100`} className="w-full h-full object-cover grayscale" alt="" referrerPolicy="no-referrer" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1"><h4 className="font-serif italic font-bold truncate">{event.title}</h4>{event.verified && <CheckCircle2 size={13} className="text-blue-600" />}</div>
        <div className="flex items-center gap-3 text-[10px] uppercase opacity-50">
          <span className="flex items-center gap-1"><Clock size={11} />{new Date(event.start_time).toLocaleDateString()}</span>
          <span className="bg-[#141414]/10 px-1">{event.category}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono font-bold">{event.price > 0 ? `₹${event.price}` : 'FREE'}</p>
        <p className="text-[10px] font-bold uppercase underline">Details</p>
      </div>
    </div>
  );
}

function TasksView({ tasks, setTasks, setShowTaskModal }: any) {
  const toggleTask = async (id: string, completed: boolean) => {
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !completed }) });
    setTasks((prev: any[]) => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev: any[]) => prev.filter(t => t.id !== id));
  };
  const taskList = Array.isArray(tasks) ? tasks : [];
  const priorities = ['High', 'Medium', 'Low'];
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-serif italic font-bold">My Tasks</h3>
        <button onClick={() => setShowTaskModal(true)} className="bg-[#141414] text-white px-6 py-2 text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Plus size={16} />Add Task</button>
      </div>
      {taskList.length === 0 && <div className="py-16 text-center border-2 border-dashed border-[#141414]/10"><p className="font-serif italic opacity-30 text-lg">No tasks yet. Click "Add Task" to get started!</p></div>}
      {priorities.map(priority => {
        const pt = taskList.filter(t => (t.priority || '').toLowerCase() === priority.toLowerCase());
        if (pt.length === 0) return null;
        return (
          <div key={priority} className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">{priority} Priority</h4>
            <div className="bg-white border border-[#141414] divide-y divide-[#141414]/10">
              {pt.map(task => (
                <div key={task.id} className="p-4 flex items-center gap-4 group">
                  <div onClick={() => toggleTask(task.id, task.completed)} className={`w-5 h-5 border-2 border-[#141414] cursor-pointer flex items-center justify-center flex-shrink-0 ${task.completed ? 'bg-[#141414]' : 'hover:bg-[#141414]/10'}`}>
                    {task.completed && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.completed ? 'line-through opacity-40' : ''}`}>{task.title}</p>
                    <p className="text-[10px] opacity-50">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'} • {task.category}</p>
                  </div>
                  {/* Add to Google Calendar button per task */}
                  <button onClick={() => addTaskToGoogleCalendar(task)} title="Add to Google Calendar"
                    className="opacity-0 group-hover:opacity-100 text-[#4285F4] p-1 hover:bg-blue-50 transition-all text-[10px] font-bold">
                    📅
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-50 transition-all"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ODCalculator({ registeredEvents }: { registeredEvents: Event[] }) {
  const OD_LIMIT = 40;
  const now = new Date();

  // Past (completed) events → count as used OD hours
  const pastEvents = registeredEvents.filter(e => new Date(e.end_time) < now);
  // Future/ongoing events → pending OD hours
  const upcomingEvents = registeredEvents.filter(e => new Date(e.end_time) >= now);

  const calcHours = (evts: Event[]) =>
    evts.reduce((acc, e) =>
      acc + Math.min((new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000, 8), 0);

  const usedHours = calcHours(pastEvents);
  const pendingHours = calcHours(upcomingEvents);
  const percentage = Math.min((usedHours / OD_LIMIT) * 100, 100);
  const pendingPct = Math.min(((usedHours + pendingHours) / OD_LIMIT) * 100, 100);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-[#141414] text-[#E4E3E0] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <h3 className="text-3xl font-serif italic font-bold mb-4">OD Hours Tracker</h3>
        <div className="grid grid-cols-3 gap-6">
          <div><p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Hours Used</p><p className="text-4xl font-mono font-bold">{usedHours.toFixed(1)}</p></div>
          <div><p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Pending</p><p className="text-4xl font-mono font-bold text-blue-400">{pendingHours.toFixed(1)}</p></div>
          <div><p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Remaining</p><p className="text-4xl font-mono font-bold text-orange-400">{Math.max(0, OD_LIMIT - usedHours).toFixed(1)}</p></div>
        </div>
        {/* Stacked bar: used (white) + pending (white/40) */}
        <div className="mt-6 h-3 bg-white/10 relative overflow-hidden rounded-sm">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pendingPct}%` }}
            className="absolute h-full bg-white/30"
          />
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
            className="absolute h-full bg-white"
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] opacity-50 uppercase">{percentage.toFixed(1)}% used · {(pendingPct - percentage).toFixed(1)}% pending</p>
          <p className="text-[10px] opacity-50">{OD_LIMIT}hr limit</p>
        </div>
        <div className="flex gap-4 mt-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-2 bg-white inline-block"></span> Completed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 bg-white/30 inline-block"></span> Upcoming</span>
        </div>
      </div>

      {/* Past events */}
      {pastEvents.length > 0 && (
        <div>
          <h4 className="text-lg font-serif italic font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" /> Completed Events (OD Credited)
          </h4>
          <div className="bg-white border border-[#141414] divide-y divide-[#141414]/10">
            {pastEvents.map(e => {
              const hrs = Math.min((new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000, 8);
              return (
                <div key={e.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{e.title}</p>
                    <p className="text-[10px] opacity-50 uppercase">{new Date(e.start_time).toLocaleDateString()} · {e.category}</p>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1">+{hrs.toFixed(1)}h</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming/ongoing events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h4 className="text-lg font-serif italic font-bold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" /> Upcoming Events (Pending OD)
          </h4>
          <div className="bg-white border border-[#141414] divide-y divide-[#141414]/10">
            {upcomingEvents.map(e => {
              const hrs = Math.min((new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000, 8);
              return (
                <div key={e.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{e.title}</p>
                    <p className="text-[10px] opacity-50 uppercase">{new Date(e.start_time).toLocaleDateString()} · {e.category}</p>
                  </div>
                  <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1">{hrs.toFixed(1)}h</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {registeredEvents.length === 0 && (
        <div className="py-10 text-center border-2 border-dashed border-[#141414]/10">
          <p className="font-serif italic opacity-30">No registered events yet.</p>
        </div>
      )}
    </div>
  );
}

// ---- TIMETABLE — no Google Calendar sync here ----
function Timetable() {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const timeLabels = ['08:00', '08:50', '09:45', '10:40', '11:35', '12:30', 'LUNCH', '13:25', '14:00', '14:50', '15:45', '16:40', '17:35', '18:30'];

  const [timetable, setTimetable] = useState<any[]>([]);
  const csvRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/timetable').then(r => r.ok ? r.json() : []).then(d => setTimetable(Array.isArray(d) ? d : [])).catch(() => setTimetable([]));
  }, []);

  const getCell = (day: string, period: number) => timetable.find(t => t.day === day && t.period === period);

  const editCell = (day: string, period: number) => {
    const current = getCell(day, period)?.subject || '';
    const sub = prompt(`Subject for ${day} Period ${period}:`, current);
    if (sub !== null) {
      fetch('/api/timetable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day, period, subject: sub }) })
        .then(() => setTimetable(prev => [...prev.filter(t => !(t.day === day && t.period === period)), { day, period, subject: sub }]));
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const rows = text.split('\n').slice(1).map(r => r.split(','));
    const data = rows.filter(r => r.length >= 3).map(r => ({
      day: r[0]?.trim().toUpperCase(), period: parseInt(r[1]?.trim()), subject: r[2]?.trim()
    })).filter(r => r.day && r.period && r.subject);
    const res = await fetch('/api/timetable/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
    const result = await res.json();
    if (result.success) {
      alert(`✅ Uploaded! ${data.length} entries added.`);
      const tt = await fetch('/api/timetable').then(r => r.json());
      setTimetable(Array.isArray(tt) ? tt : []);
    } else alert('Upload failed');
    if (csvRef.current) csvRef.current.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    alert(`📷 Image received! OCR would auto-extract in production. Edit cells manually for now.`);
    if (imgRef.current) imgRef.current.value = '';
  };

  const getCellBg = (rowType: 'theory' | 'lab') =>
    rowType === 'theory' ? 'bg-yellow-100 text-yellow-900' : 'bg-green-100 text-green-900';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-2xl font-serif italic font-bold">Student Timetable</h3>
        <div className="flex gap-2 flex-wrap">
          <input ref={csvRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          <button onClick={() => csvRef.current?.click()} className="border border-[#141414] px-3 py-2 text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#141414]/5"><Upload size={13} />Upload CSV</button>
          <input ref={imgRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button onClick={() => imgRef.current?.click()} className="border border-[#141414] px-3 py-2 text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#141414]/5"><Upload size={13} />Upload Image</button>
        </div>
      </div>

      <p className="text-xs text-[#141414]/50">💡 CSV: <code>Day,Period,Subject</code> e.g. <code>MON,1,A1-BCSE302L-TH-AB3-206-ALL</code> • Click any cell to edit inline</p>

      <div className="overflow-x-auto border border-gray-400">
        <table className="border-collapse text-[10px] w-full bg-white" style={{ minWidth: '900px' }}>
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 p-1 font-bold text-center w-12" rowSpan={2}>Day</th>
              <th className="border border-gray-400 p-1 font-bold text-center w-14">Type</th>
              {timeLabels.map((t, i) => (
                <th key={i} className={`border border-gray-400 p-1 font-bold text-center ${t === 'LUNCH' ? 'bg-orange-200' : 'bg-gray-100'}`} style={{ minWidth: t === 'LUNCH' ? '50px' : '65px' }}>
                  {t}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-1 text-center text-[9px] text-gray-500">Period</th>
              {timeLabels.map((t, i) => {
                if (t === 'LUNCH') return <th key={i} className="border border-gray-400 bg-orange-100"></th>;
                const pNum = timeLabels.slice(0, i + 1).filter(x => x !== 'LUNCH').length;
                return <th key={i} className="border border-gray-400 p-1 text-center text-gray-400 font-normal">{pNum}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <React.Fragment key={day}>
                <tr>
                  <td rowSpan={2} className="border border-gray-400 p-1 font-bold text-center bg-gray-100 align-middle">{day}</td>
                  <td className="border border-gray-400 p-1 text-center font-bold bg-yellow-50 text-yellow-800">THEORY</td>
                  {timeLabels.map((t, i) => {
                    if (t === 'LUNCH') return <td key={i} className="border border-gray-400 bg-orange-100 text-center font-bold text-orange-700">Lunch</td>;
                    const pNum = timeLabels.slice(0, i + 1).filter(x => x !== 'LUNCH').length;
                    const cell = getCell(day, pNum);
                    const isTheory = cell && !cell.subject?.toUpperCase().includes('LAB') && !cell.subject?.match(/L\d+/);
                    return (
                      <td key={i} onClick={() => editCell(day, pNum)}
                        className={`border border-gray-400 p-1 text-center cursor-pointer hover:bg-yellow-200 transition-colors ${isTheory ? getCellBg('theory') : ''}`}>
                        <div className="text-[9px] leading-tight font-medium" style={{ maxWidth: '65px', wordBreak: 'break-word' }}>
                          {isTheory ? cell!.subject : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 text-center font-bold bg-green-50 text-green-800">LAB</td>
                  {timeLabels.map((t, i) => {
                    if (t === 'LUNCH') return <td key={i} className="border border-gray-400 bg-orange-50"></td>;
                    const pNum = timeLabels.slice(0, i + 1).filter(x => x !== 'LUNCH').length;
                    const cell = getCell(day, pNum);
                    const isLab = cell && (cell.subject?.toUpperCase().includes('LAB') || cell.subject?.match(/L\d+/) || cell.subject?.toUpperCase().includes('-LO-'));
                    return (
                      <td key={i} onClick={() => editCell(day, pNum)}
                        className={`border border-gray-400 p-1 text-center cursor-pointer hover:bg-green-200 transition-colors ${isLab ? getCellBg('lab') : ''}`}>
                        <div className="text-[9px] leading-tight font-medium" style={{ maxWidth: '65px', wordBreak: 'break-word' }}>
                          {isLab ? cell!.subject : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VerifiedEventsView({ events, type, user, setShowCreateModal, setSelectedEvent, registeredEvents, setRegisteredEvents }: any) {
  const filteredEvents = events.filter((e: Event) => (e.verified === 1 || e.verified === true) && e.type === type);
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${type === 'college' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
            {type === 'college' ? <Award size={24} /> : <Zap size={24} />}
          </div>
          <div>
            <h3 className="text-2xl font-serif italic font-bold capitalize">{type} Verified Events</h3>
            <p className="text-xs opacity-50 uppercase tracking-widest">Official announcements</p>
          </div>
        </div>
        {user.role === 'admin' && <button onClick={() => setShowCreateModal(true)} className="bg-[#141414] text-white px-6 py-2 text-sm font-bold uppercase flex items-center gap-2"><Plus size={16} />Add Official Event</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length > 0
          ? filteredEvents.map((event: Event) => <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />)
          : <div className="col-span-full py-20 text-center border-2 border-dashed border-[#141414]/10"><p className="font-serif italic opacity-30">No official {type} events yet{user.role === 'admin' ? ' — create one above!' : ''}</p></div>}
      </div>
    </div>
  );
}

function ForumView({ events, user }: { events: Event[], user: User }) {
  const verifiedEvents = events.filter(e => e.verified === 1 || e.verified === true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(verifiedEvents[0] || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedEvent) {
      fetch(`/api/forum/${selectedEvent.id}`).then(r => r.ok ? r.json() : []).then(d => setMessages(Array.isArray(d) ? d : [])).catch(() => setMessages([]));
    }
  }, [selectedEvent]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'FORUM_MESSAGE' && data.message.event_id === selectedEvent?.id) {
        setMessages(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          if (arr.some(m => m.id === data.message.id)) return arr;
          return [...arr, data.message];
        });
      }
    };
    return () => ws.close();
  }, [selectedEvent]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedEvent || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/forum/${selectedEvent.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: newMessage }) });
      const data = await res.json();
      if (data.id) {
        setMessages(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          if (arr.some(m => m.id === data.id)) return arr;
          return [...arr, data];
        });
        setNewMessage('');
      } else alert(data.error || 'Failed to send');
    } catch (e) { alert('Failed to send message'); }
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] border border-[#141414] bg-white">
      <div className="w-72 border-r border-[#141414] flex flex-col">
        <div className="p-4 border-b border-[#141414] bg-[#141414]/5">
          <h3 className="text-xs font-bold uppercase tracking-widest">Channels</h3>
          <p className="text-[10px] opacity-50 mt-1">Everyone can chat</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {verifiedEvents.map(event => (
            <button key={event.id} onClick={() => setSelectedEvent(event)}
              className={`w-full p-4 text-left border-b border-[#141414]/10 hover:bg-[#141414]/5 ${selectedEvent?.id === event.id ? 'bg-[#141414]/10 border-l-2 border-l-[#141414]' : ''}`}>
              <p className="text-sm font-bold truncate"># {event.title}</p>
              <p className="text-[10px] opacity-50 uppercase">{event.category}</p>
            </button>
          ))}
          {verifiedEvents.length === 0 && <div className="p-4 text-xs opacity-30 italic">No verified events yet</div>}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedEvent ? (
          <>
            <div className="p-4 border-b border-[#141414] flex items-center justify-between">
              <div>
                <h3 className="font-serif italic font-bold"># {selectedEvent.title}</h3>
                <p className="text-[10px] opacity-40 uppercase">{user.role === 'admin' ? '👑 Admin' : '🎓 Student'} • Everyone can chat</p>
              </div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span><span className="text-[10px] font-bold uppercase opacity-50">Live</span></div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#E4E3E0]/20">
              {messages.map(msg => {
                const isMe = msg.user_id === user.id;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white ${msg.user_role === 'admin' ? 'bg-purple-600' : 'bg-[#141414]'}`}>
                      {(msg.user_name || 'U')[0].toUpperCase()}
                    </div>
                    <div className={`max-w-xs flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-bold">{msg.user_name}</span>
                        {msg.user_role === 'admin' && <span className="text-[8px] bg-purple-100 text-purple-700 px-1 font-bold uppercase">Admin</span>}
                        <span className="text-[8px] opacity-40">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`border border-[#141414] p-3 text-sm shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] ${isMe ? 'bg-[#141414] text-white' : 'bg-white'}`}>{msg.message}</div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && <div className="text-center py-16 opacity-20 italic text-sm">No messages yet. Be the first!</div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-[#141414]">
              <form onSubmit={handleSend} className="flex gap-2">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={sending}
                  className="flex-1 border border-[#141414] p-3 text-sm focus:outline-none focus:bg-[#141414]/5 disabled:opacity-50"
                  placeholder={`Message #${selectedEvent.title.slice(0, 20)}...`} />
                <button type="submit" disabled={sending || !newMessage.trim()} className="bg-[#141414] text-white p-3 hover:bg-[#141414]/90 disabled:opacity-50"><Send size={18} /></button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-30"><p className="font-serif italic">Select a channel to start chatting</p></div>
        )}
      </div>
    </div>
  );
}

function Portfolio({ events, registeredEvents, tasks, user }: { events: Event[], registeredEvents: Event[], tasks: any[], user: User }) {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const now = new Date();
  const upcoming = registeredEvents.filter(e => new Date(e.start_time) > now);
  const ongoing = registeredEvents.filter(e => new Date(e.start_time) <= now && new Date(e.end_time) >= now);
  const completed = registeredEvents.filter(e => new Date(e.end_time) < now);
  const tabData: Record<string, Event[]> = { Upcoming: upcoming, Ongoing: ongoing, Completed: completed };
  const completedTasks = tasks.filter(t => t.completed);
  const taskPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-8 flex-wrap">
        <div className="w-24 h-24 border-2 border-[#141414] flex items-center justify-center bg-[#141414] text-white text-3xl font-bold">{user.name[0].toUpperCase()}</div>
        <div>
          <h2 className="text-4xl font-serif italic font-bold">{user.name}</h2>
          <p className="text-sm uppercase tracking-[0.3em] opacity-50 mt-1">{user.role === 'admin' ? 'Administrator' : 'Student'} • {user.email}</p>
          <div className="flex gap-6 mt-4">
            <div className="text-center"><p className="text-xl font-mono font-bold">{registeredEvents.length}</p><p className="text-[8px] uppercase opacity-50">Registered</p></div>
            <div className="text-center"><p className="text-xl font-mono font-bold">{upcoming.length}</p><p className="text-[8px] uppercase opacity-50">Upcoming</p></div>
            <div className="text-center"><p className="text-xl font-mono font-bold">{completed.length}</p><p className="text-[8px] uppercase opacity-50">Completed</p></div>
            <div className="text-center"><p className="text-xl font-mono font-bold">{taskPct}%</p><p className="text-[8px] uppercase opacity-50">Tasks Done</p></div>
          </div>
        </div>
      </div>
      <div>
        <div className="flex border-b border-[#141414] mb-6">
          {['Upcoming', 'Ongoing', 'Completed'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === tab ? 'border-b-2 border-[#141414]' : 'opacity-40 hover:opacity-70'}`}>
              {tab} ({tabData[tab].length})
            </button>
          ))}
        </div>
        {tabData[activeTab].length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tabData[activeTab].map(event => (
              <div key={event.id} className="bg-white border border-[#141414] p-5 flex gap-4">
                <div className="w-16 h-16 flex-shrink-0 overflow-hidden"><img src={`https://picsum.photos/seed/${event.id}/200/200`} className="w-full h-full object-cover grayscale" alt="" referrerPolicy="no-referrer" /></div>
                <div className="flex-1">
                  <h4 className="font-serif italic font-bold">{event.title}</h4>
                  <p className="text-[10px] opacity-50 uppercase mb-2">{event.category} • {activeTab}</p>
                  <p className="text-[10px]">{new Date(event.start_time).toLocaleDateString()} – {new Date(event.end_time).toLocaleDateString()}</p>
                  {event.payment_status && (
                    <span className={`text-[9px] px-2 py-0.5 font-bold uppercase ${event.payment_status === 'free' || event.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {event.payment_status === 'free' ? '✅ Free' : event.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-[#141414]/10">
            <p className="font-serif italic opacity-30">No {activeTab.toLowerCase()} events.</p>
          </div>
        )}
      </div>
      {tasks.length > 0 && (
        <div>
          <h3 className="text-xl font-serif italic font-bold mb-4">Task Progress</h3>
          <div className="bg-white border border-[#141414] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold">{completedTasks.length} / {tasks.length} completed</span>
              <span className="text-sm font-mono font-bold">{taskPct}%</span>
            </div>
            <div className="h-2 bg-[#141414]/10"><motion.div initial={{ width: 0 }} animate={{ width: `${taskPct}%` }} className="h-full bg-[#141414]" /></div>
          </div>
        </div>
      )}
    </div>
  );
}