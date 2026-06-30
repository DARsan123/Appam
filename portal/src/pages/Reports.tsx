import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

export default function Reports() {
  const { user } = useAuth();
  const [daily, setDaily] = useState<Array<{ date: string; count: number }>>([]);
  const [gateTraffic, setGateTraffic] = useState<Array<{ gate: string; count: number }>>([]);
  const [overdue, setOverdue] = useState<Array<{ id: string; visitor: { name: string } }>>([]);

  useEffect(() => {
    const campus = user?.campusId ?? '';
    api<typeof daily>(`/reports/daily-count?days=7&campusId=${campus}`).then(setDaily);
    api<typeof gateTraffic>(`/reports/gate-traffic?campusId=${campus}`).then(setGateTraffic);
    api<typeof overdue>('/reports/overdue-checkouts').then(setOverdue);
  }, [user]);

  const maxCount = Math.max(...daily.map((d) => d.count), 1);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Reports & Analytics</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Daily Visitor Count (7 days)</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {daily.map((d) => (
            <div key={d.date} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ background: 'var(--primary)', height: `${(d.count / maxCount) * 100}px`, borderRadius: '4px 4px 0 0', minHeight: 4 }} />
              <small style={{ fontSize: 10 }}>{d.date.slice(5)}</small>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{d.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Gate-wise Traffic</h3>
          <table>
            <thead><tr><th>Gate</th><th>Check-ins</th></tr></thead>
            <tbody>
              {gateTraffic.map((g) => <tr key={g.gate}><td>{g.gate}</td><td>{g.count}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Overdue Checkouts</h3>
          {overdue.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No overdue checkouts</p>
          ) : (
            <ul>{overdue.map((v) => <li key={v.id}>{v.visitor.name}</li>)}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
