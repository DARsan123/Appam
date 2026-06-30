import { useEffect, useState } from 'react';
import { api } from '../api';

interface Visit {
  id: string; purpose: string; status: string;
  visitor: { name: string; phone: string };
  host: { name: string };
  campus: { name: string };
  expectedStart: string;
}

export default function Approvals() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const load = () => api<Visit[]>('/visits/pending').then(setVisits).catch(console.error);
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    await api(`/visits/${id}/approve`, { method: 'POST' });
    load();
  };

  const reject = async () => {
    if (!rejectId || !reason) return;
    await api(`/visits/${rejectId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    setRejectId(null);
    setReason('');
    load();
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Pending Approvals</h1>
      <div className="card">
        <table>
          <thead>
            <tr><th>Visitor</th><th>Host</th><th>Purpose</th><th>Campus</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.visitor.name}</strong><br /><small>{v.visitor.phone}</small></td>
                <td>{v.host?.name}</td>
                <td>{v.purpose}</td>
                <td>{v.campus?.name}</td>
                <td>{new Date(v.expectedStart).toLocaleString()}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => approve(v.id)}>Approve</button>
                  <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setRejectId(v.id)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visits.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No pending approvals</p>}
      </div>

      {rejectId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 400 }}>
            <h3>Reject Visit</h3>
            <div className="form-group">
              <label>Reason</label>
              <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" onClick={reject}>Confirm Reject</button>
              <button className="btn btn-outline" onClick={() => setRejectId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
