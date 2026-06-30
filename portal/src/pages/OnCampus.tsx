import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

interface Visit {
  id: string;
  visitor: { name: string; phone: string };
  host: { name: string };
  campus: { name: string };
  building?: string;
  purpose: string;
  checkInRecords: Array<{ checkInTime: string; gate: { name: string } }>;
}

export default function OnCampus() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);

  const load = () => api<Visit[]>(`/visits/on-campus?campusId=${user?.campusId ?? ''}`).then(setVisits).catch(console.error);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const exportHeadcount = async () => {
    const data = await api<Array<Record<string, unknown>>>(`/reports/headcount?campusId=${user?.campusId ?? ''}`);
    const csv = ['Name,Phone,Host,Campus,Gate,CheckIn,Building',
      ...data.map((r) => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `headcount-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Who's On Campus ({visits.length})</h1>
        <button className="btn btn-outline" onClick={exportHeadcount}>Export Headcount (Fire Safety)</button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>Visitor</th><th>Host</th><th>Purpose</th><th>Campus</th><th>Gate</th><th>Check-in Time</th></tr>
          </thead>
          <tbody>
            {visits.map((v) => {
              const record = v.checkInRecords?.find((r) => r);
              return (
                <tr key={v.id}>
                  <td><strong>{v.visitor.name}</strong><br /><small>{v.visitor.phone}</small></td>
                  <td>{v.host?.name}</td>
                  <td>{v.purpose}</td>
                  <td>{v.campus?.name}</td>
                  <td>{record?.gate?.name ?? '-'}</td>
                  <td>{record ? new Date(record.checkInTime).toLocaleString() : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visits.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No visitors currently on campus</p>}
      </div>
    </div>
  );
}
