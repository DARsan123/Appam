import { useEffect, useState } from 'react';
import { api } from '../api';

interface Entry {
  id: string; phone?: string; idProofNumber?: string; reason: string; reasonCode: string;
  isGlobal: boolean; scopeCampus?: { name: string }; reviewDate?: string; expiresAt?: string;
  createdBy: { name: string }; createdAt: string;
}

export default function Blacklist() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ phone: '', idProofNumber: '', reason: '', reasonCode: 'security_incident', isGlobal: true });

  const load = () => api<Entry[]>('/blacklist').then(setEntries).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/blacklist', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Blacklist / Watchlist</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>Add Entry</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 500 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="form-group"><label>ID Proof Number</label><input value={form.idProofNumber} onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })} /></div>
            <div className="form-group"><label>Reason *</label><input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="form-group">
              <label>Reason Code</label>
              <select value={form.reasonCode} onChange={(e) => setForm({ ...form, reasonCode: e.target.value })}>
                <option value="security_incident">Security Incident</option>
                <option value="policy_violation">Policy Violation</option>
                <option value="legal">Legal/RTI</option>
              </select>
            </div>
            <button type="submit" className="btn btn-danger">Add to Blacklist</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Phone/ID</th><th>Reason</th><th>Scope</th><th>Added By</th><th>Review Date</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{e.phone || e.idProofNumber}</td>
                <td>{e.reason}</td>
                <td>{e.isGlobal ? 'Institute-wide' : e.scopeCampus?.name}</td>
                <td>{e.createdBy?.name}</td>
                <td>{e.reviewDate ? new Date(e.reviewDate).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
