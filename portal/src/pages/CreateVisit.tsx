import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

interface Campus { id: string; name: string; code: string; }

export default function CreateVisit() {
  const navigate = useNavigate();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    visitorName: '', visitorPhone: '', visitorEmail: '', purpose: '',
    campusId: '', building: '', expectedStart: '', expectedEnd: '',
    category: 'individual', vehicleNumber: '', isVip: false,
  });

  useEffect(() => {
    api<Campus[]>('/campuses').then((c) => {
      setCampuses(c);
      if (c.length) setForm((f) => ({ ...f, campusId: c[0].id }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const visit = await api<{ id: string }>('/visits', { method: 'POST', body: JSON.stringify(form) });
      const qr = await api<{ url: string }>(`/visits/${visit.id}/qr`);
      setSuccess(`Visit created! Share registration link: ${qr.url}`);
      setTimeout(() => navigate('/visits'), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultStart = new Date().toISOString().slice(0, 16);
  const defaultEnd = tomorrow.toISOString().slice(0, 16);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Register Visitor</h1>
      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Visitor Name *</label>
              <input required value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input required value={form.visitorPhone} onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.visitorEmail} onChange={(e) => setForm({ ...form, visitorEmail: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Purpose *</label>
            <input required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Campus *</label>
              <select required value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })}>
                {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Building</label>
              <input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Expected Start *</label>
              <input type="datetime-local" required defaultValue={defaultStart}
                onChange={(e) => setForm({ ...form, expectedStart: new Date(e.target.value).toISOString() })} />
            </div>
            <div className="form-group">
              <label>Expected End *</label>
              <input type="datetime-local" required defaultValue={defaultEnd}
                onChange={(e) => setForm({ ...form, expectedEnd: new Date(e.target.value).toISOString() })} />
            </div>
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="individual">Individual</option>
                <option value="vendor">Vendor</option>
                <option value="vip">VIP</option>
                <option value="bulk_event">Bulk Event</option>
              </select>
            </div>
            <div className="form-group">
              <label>Vehicle Number</label>
              <input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label><input type="checkbox" checked={form.isVip} onChange={(e) => setForm({ ...form, isVip: e.target.checked })} /> VIP Visit (bypasses standard approval)</label>
          </div>
          <button type="submit" className="btn btn-primary">Create Visit Request</button>
        </form>
      </div>
    </div>
  );
}
