import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

interface Visit {
  id: string;
  purpose: string;
  status: string;
  expectedStart: string;
  expectedEnd: string;
  visitor: { name: string; phone: string };
  campus: { name: string };
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    approved: 'badge-success', pending_approval: 'badge-warning', checked_in: 'badge-info',
    checked_out: 'badge-info', rejected: 'badge-danger', expired: 'badge-danger',
  };
  return map[s] ?? 'badge-info';
};

export default function Visits() {
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    api<Visit[]>('/visits/my').then(setVisits).catch(console.error);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>My Visits</h1>
        <Link to="/visits/new" className="btn btn-primary">New Visit</Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>Visitor</th><th>Purpose</th><th>Campus</th><th>Date</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.visitor.name}</strong><br /><small>{v.visitor.phone}</small></td>
                <td>{v.purpose}</td>
                <td>{v.campus?.name}</td>
                <td>{new Date(v.expectedStart).toLocaleDateString()}</td>
                <td><span className={`badge ${statusBadge(v.status)}`}>{v.status.replace('_', ' ')}</span></td>
                <td>
                  {v.status === 'approved' && (
                    <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 8px' }}
                      onClick={() => api(`/visits/${v.id}/qr`).then((qr: { url: string }) => window.open(qr.url, '_blank'))}>
                      QR Link
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visits.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No visits yet</p>}
      </div>
    </div>
  );
}
