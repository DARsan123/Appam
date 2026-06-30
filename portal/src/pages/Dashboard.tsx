import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ onCampus: 0, todayVisits: 0, pendingApprovals: 0, blacklistCount: 0 });
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; createdAt: string }>>([]);

  useEffect(() => {
    api<typeof stats>(`/reports/dashboard?campusId=${user?.campusId ?? ''}`).then(setStats).catch(console.error);
    api<typeof notifications>('/notifications').then(setNotifications).catch(console.error);
  }, [user]);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        <div className="stat-card"><div className="value">{stats.onCampus}</div><div className="label">On Campus Now</div></div>
        <div className="stat-card"><div className="value">{stats.todayVisits}</div><div className="label">Today's Visits</div></div>
        <div className="stat-card"><div className="value">{stats.pendingApprovals}</div><div className="label">Pending Approvals</div></div>
        <div className="stat-card"><div className="value">{stats.blacklistCount}</div><div className="label">Blacklist Entries</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user?.role === 'host' && <Link to="/visits/new" className="btn btn-primary">Register New Visitor</Link>}
            {(user?.role === 'host' || user?.role === 'admin') && <Link to="/approvals" className="btn btn-outline">Review Pending Approvals</Link>}
            {['gate_security', 'security_supervisor', 'admin'].includes(user?.role ?? '') && (
              <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="btn btn-outline">Open Gate Console</a>
            )}
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Recent Notifications</h3>
          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No notifications</p>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <strong>{n.title}</strong>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
