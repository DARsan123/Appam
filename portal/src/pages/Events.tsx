import { useEffect, useState } from 'react';
import { api } from '../api';

interface Event {
  id: string; name: string; startDate: string; endDate: string;
  expectedAttendees: number; fastLaneEnabled: boolean;
  campus: { name: string };
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [campuses, setCampuses] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', campusId: '', startDate: '', endDate: '', expectedAttendees: 100, fastLaneEnabled: true });

  useEffect(() => {
    api<Event[]>('/events').then(setEvents).catch(console.error);
    api<Array<{ id: string; name: string }>>('/campuses').then((c) => {
      setCampuses(c);
      if (c.length) setForm((f) => ({ ...f, campusId: c[0].id }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/events', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false);
    api<Event[]>('/events').then(setEvents);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Events</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>Create Event</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 500 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Event Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group">
              <label>Campus</label>
              <select value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })}>
                {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-2">
              <div className="form-group"><label>Start</label><input type="datetime-local" required onChange={(e) => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} /></div>
              <div className="form-group"><label>End</label><input type="datetime-local" required onChange={(e) => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} /></div>
            </div>
            <div className="form-group"><label>Expected Attendees</label><input type="number" value={form.expectedAttendees} onChange={(e) => setForm({ ...form, expectedAttendees: parseInt(e.target.value) })} /></div>
            <label><input type="checkbox" checked={form.fastLaneEnabled} onChange={(e) => setForm({ ...form, fastLaneEnabled: e.target.checked })} /> Enable Fast Lane</label>
            <br /><br />
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Event</th><th>Campus</th><th>Date</th><th>Attendees</th><th>Fast Lane</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td><strong>{e.name}</strong></td>
                <td>{e.campus?.name}</td>
                <td>{new Date(e.startDate).toLocaleDateString()}</td>
                <td>{e.expectedAttendees}</td>
                <td>{e.fastLaneEnabled ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
