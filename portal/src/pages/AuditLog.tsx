import { useEffect, useState } from 'react';
import { api } from '../api';

interface AuditEntry {
  id: string; action: string; entityType: string; entityId: string;
  user?: { name: string }; createdAt: string; hash: string;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [chainValid, setChainValid] = useState<boolean | null>(null);

  useEffect(() => {
    api<AuditEntry[]>('/audit').then(setLogs);
    api<{ valid: boolean }>('/audit/verify').then((r) => setChainValid(r.valid));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Audit Log</h1>
        {chainValid !== null && (
          <span className={`badge ${chainValid ? 'badge-success' : 'badge-danger'}`}>
            Hash Chain {chainValid ? 'Valid ✓' : 'BROKEN ✗'}
          </span>
        )}
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>User</th><th>Hash</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td style={{ fontSize: 13 }}>{new Date(l.createdAt).toLocaleString()}</td>
                <td><span className="badge badge-info">{l.action}</span></td>
                <td>{l.entityType} {l.entityId?.slice(0, 8)}</td>
                <td>{l.user?.name ?? 'System'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{l.hash.slice(0, 12)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
