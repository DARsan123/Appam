import { useState, useEffect, useCallback } from 'react';
import { login, api } from './api';
import { db } from './db';

interface Gate { id: string; name: string; campusId: string; eventModeEnabled: boolean; campus: { name: string }; }
interface Badge { number: string; visitorName: string; hostName: string; validUntil: string; badgeType: string; }

const OFFLINE_STALE_MS = 2 * 60 * 60 * 1000; // 2 hours per PRD

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('vms_token'));
  const [email, setEmail] = useState('security@iiml.ac.in');
  const [password, setPassword] = useState('password123');
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState('');
  const [mode, setMode] = useState<'standard' | 'fast_lane'>('standard');
  const [qrToken, setQrToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [badge, setBadge] = useState<Badge | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [cacheStale, setCacheStale] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [walkIn, setWalkIn] = useState(false);
  const [hosts, setHosts] = useState<Array<{ id: string; name: string }>>([]);
  const [walkInForm, setWalkInForm] = useState({ visitorName: '', visitorPhone: '', purpose: '', hostId: '' });

  useEffect(() => {
    const onOnline = () => { setOnline(true); syncOffline(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const refreshCache = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const cache = await api<unknown>('/sync/gate-cache');
      await db.cache.put({ id: 'main', syncedAt: new Date().toISOString(), data: cache });
      setCacheStale(false);
    } catch { /* use stale cache */ }
  }, []);

  useEffect(() => {
    if (!authed) return;
    api<Gate[]>('/campuses/gates').then((g) => {
      setGates(g);
      if (g.length) setSelectedGate(g[0].id);
    });
    api<Array<{ id: string; name: string }>>('/users/hosts').then(setHosts);
    refreshCache();
    const interval = setInterval(refreshCache, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [authed, refreshCache]);

  useEffect(() => {
    db.cache.get('main').then((c) => {
      if (c && Date.now() - new Date(c.syncedAt).getTime() > OFFLINE_STALE_MS) {
        setCacheStale(true);
      }
    });
    db.offlineQueue.where('synced').equals(0).count().then(setPendingSync);
  }, [online]);

  const syncOffline = async () => {
    const pending = await db.offlineQueue.where('synced').equals(0).toArray();
    if (!pending.length) return;
    try {
      await api('/checkin/sync', {
        method: 'POST',
        body: JSON.stringify({
          events: pending.map((e) => ({
            qrToken: e.qrToken,
            gateId: e.gateId,
            checkInTime: e.checkInTime,
            offlineClientId: e.offlineClientId,
            type: e.type,
          })),
        }),
      });
      for (const e of pending) {
        if (e.id) await db.offlineQueue.update(e.id, { synced: true });
      }
      setPendingSync(0);
      setMessage(`Synced ${pending.length} offline events`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { accessToken, user } = await login(email, password);
    localStorage.setItem('vms_token', accessToken);
    localStorage.setItem('vms_user', JSON.stringify(user));
    setAuthed(true);
  };

  const handleCheckIn = async () => {
    setError('');
    setMessage('');
    setBadge(null);
    if (!qrToken.trim()) { setError('Enter QR token'); return; }
    if (cacheStale && !online) { setError('Blacklist cache stale — manual ID verification required'); return; }

    const payload = {
      qrToken: qrToken.trim(),
      gateId: selectedGate,
      mode: mode === 'fast_lane' ? 'fast_lane' : online ? 'standard' : 'offline',
      offlineClientId: online ? undefined : crypto.randomUUID(),
    };

    if (!online) {
      await db.offlineQueue.add({
        qrToken: payload.qrToken,
        gateId: payload.gateId,
        type: 'check_in',
        checkInTime: new Date().toISOString(),
        offlineClientId: payload.offlineClientId!,
        synced: false,
      });
      setPendingSync((p) => p + 1);
      setMessage('Check-in queued offline — will sync when connected');
      setQrToken('');
      return;
    }

    try {
      const result = await api<{ badge: Badge }>('/checkin', { method: 'POST', body: JSON.stringify(payload) });
      setBadge(result.badge);
      setMessage('Check-in successful — badge ready to print');
      setQrToken('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCheckOut = async () => {
    setError('');
    try {
      if (!online) {
        await db.offlineQueue.add({
          qrToken: qrToken.trim(), gateId: selectedGate, type: 'check_out',
          checkInTime: new Date().toISOString(), offlineClientId: crypto.randomUUID(), synced: false,
        });
        setMessage('Checkout queued offline');
      } else {
        await api('/checkin/checkout', { method: 'POST', body: JSON.stringify({ qrToken: qrToken.trim() }) });
        setMessage('Checkout successful');
      }
      setQrToken('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const gate = gates.find((g) => g.id === selectedGate);
    if (!gate) return;
    await api('/checkin/walk-in', {
      method: 'POST',
      body: JSON.stringify({ ...walkInForm, campusId: gate.campusId, gateId: selectedGate }),
    });
    setMessage('Walk-in registered — approval sent to host');
    setWalkIn(false);
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)' }}>
        <div className="card" style={{ width: 400 }}>
          <h2 style={{ marginBottom: 16, color: 'var(--primary)' }}>Gate Console Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="gate-header">
        <h1>IIML VMS — Gate Console</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {!online && <span className="offline-badge">OFFLINE</span>}
          {pendingSync > 0 && <span className="offline-badge">{pendingSync} PENDING SYNC</span>}
          <select value={selectedGate} onChange={(e) => setSelectedGate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8 }}>
            {gates.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.campus?.name})</option>)}
          </select>
        </div>
      </header>

      {cacheStale && (
        <div className="stale-warning">
          ⚠ Blacklist data may be stale — perform manual ID verification before allowing entry
        </div>
      )}

      <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div className="mode-tabs">
          <button className={mode === 'standard' ? 'active' : ''} onClick={() => setMode('standard')}>Standard Check-in</button>
          <button className={mode === 'fast_lane' ? 'active' : ''} onClick={() => setMode('fast_lane')}>Event Fast Lane</button>
          <button onClick={() => setWalkIn(!walkIn)}>Walk-in</button>
        </div>

        {walkIn ? (
          <div className="card">
            <h3>Walk-in Registration</h3>
            <form onSubmit={handleWalkIn}>
              <div className="form-group"><label>Visitor Name</label><input required value={walkInForm.visitorName} onChange={(e) => setWalkInForm({ ...walkInForm, visitorName: e.target.value })} /></div>
              <div className="form-group"><label>Phone</label><input required value={walkInForm.visitorPhone} onChange={(e) => setWalkInForm({ ...walkInForm, visitorPhone: e.target.value })} /></div>
              <div className="form-group"><label>Purpose</label><input required value={walkInForm.purpose} onChange={(e) => setWalkInForm({ ...walkInForm, purpose: e.target.value })} /></div>
              <div className="form-group">
                <label>Host</label>
                <select required value={walkInForm.hostId} onChange={(e) => setWalkInForm({ ...walkInForm, hostId: e.target.value })}>
                  <option value="">Select host</option>
                  {hosts.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-lg">Register Walk-in</button>
            </form>
          </div>
        ) : (
          <>
            <div className="scan-area">
              <p style={{ fontSize: 18, marginBottom: 16 }}>Scan QR or Enter Token</p>
              <input
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="QR token..."
                style={{ width: '100%', maxWidth: 400, padding: 16, fontSize: 20, textAlign: 'center', border: '2px solid var(--border)', borderRadius: 8 }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={handleCheckIn}>Check In</button>
              <button className="btn btn-outline btn-lg" onClick={handleCheckOut}>Check Out</button>
            </div>
          </>
        )}

        {error && <div className="alert alert-error" style={{ marginTop: 24 }}>{error}</div>}
        {message && <div className="alert alert-success" style={{ marginTop: 24 }}>{message}</div>}

        {badge && (
          <div className="badge-preview" style={{ marginTop: 32 }}>
            <div className="photo" />
            <h2>{badge.visitorName}</h2>
            <p>Host: {badge.hostName}</p>
            <p>Badge: {badge.number}</p>
            <p>Type: {badge.badgeType}</p>
            <p>Valid until: {new Date(badge.validUntil).toLocaleString()}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => window.print()}>Print Badge</button>
          </div>
        )}
      </main>
    </div>
  );
}
