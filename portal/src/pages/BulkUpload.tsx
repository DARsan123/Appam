import { useState, useEffect } from 'react';
import { api } from '../api';

interface Event { id: string; name: string; }

const CSV_TEMPLATE = `name,phone,email,hostEmail
John Doe,9876543210,john@example.com,host@iiml.ac.in
Jane Smith,9876543211,jane@example.com,host@iiml.ac.in`;

export default function BulkUpload() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState('');
  const [csv, setCsv] = useState(CSV_TEMPLATE);
  const [result, setResult] = useState<{ created: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Event[]>('/events').then((e) => {
      setEvents(e);
      if (e.length) setEventId(e[0].id);
    });
  }, []);

  const handleUpload = async () => {
    setError('');
    setResult(null);
    try {
      const res = await api<{ created: number }>('/bulk/upload', {
        method: 'POST',
        body: JSON.stringify({ eventId, csv }),
      });
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Bulk Upload Attendees</h1>
      <div className="card" style={{ maxWidth: 700 }}>
        <div className="form-group">
          <label>Select Event</label>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>CSV Data</label>
          <textarea rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} style={{ fontFamily: 'monospace', fontSize: 13 }} />
          <small style={{ color: 'var(--text-muted)' }}>Columns: name, phone, email (optional), hostEmail (optional)</small>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {result && <div className="alert alert-success">Created {result.created} visit registrations with QR codes</div>}
        <button className="btn btn-primary" onClick={handleUpload}>Upload & Generate QR Codes</button>
      </div>
    </div>
  );
}
