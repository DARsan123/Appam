import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { login, api, User } from './api';
import Dashboard from './pages/Dashboard';
import Visits from './pages/Visits';
import CreateVisit from './pages/CreateVisit';
import Approvals from './pages/Approvals';
import OnCampus from './pages/OnCampus';
import Blacklist from './pages/Blacklist';
import Events from './pages/Events';
import BulkUpload from './pages/BulkUpload';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';

interface AuthCtx {
  user: User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({ user: null, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

function LoginPage() {
  const [email, setEmail] = useState('host@iiml.ac.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { accessToken, user } = await login(email, password);
      localStorage.setItem('vms_token', accessToken);
      localStorage.setItem('vms_user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)' }}>
      <div className="card" style={{ width: 420, maxWidth: '90vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: 'var(--primary)', fontSize: 24 }}>IIM Lucknow</h1>
          <p style={{ color: 'var(--text-muted)' }}>Visitor Management System</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Demo: host@iiml.ac.in / password123
        </p>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const role = user?.role ?? '';

  const navItems = [
    { to: '/', label: 'Dashboard', roles: ['admin', 'host', 'gate_security', 'security_supervisor', 'compliance', 'event_coordinator'] },
    { to: '/visits', label: 'My Visits', roles: ['host'] },
    { to: '/visits/new', label: 'New Visit', roles: ['host', 'admin', 'event_coordinator'] },
    { to: '/approvals', label: 'Approvals', roles: ['host', 'admin', 'security_supervisor'] },
    { to: '/on-campus', label: 'On Campus', roles: ['gate_security', 'security_supervisor', 'admin', 'compliance'] },
    { to: '/events', label: 'Events', roles: ['event_coordinator', 'admin'] },
    { to: '/bulk-upload', label: 'Bulk Upload', roles: ['event_coordinator', 'admin'] },
    { to: '/blacklist', label: 'Blacklist', roles: ['admin', 'security_supervisor', 'gate_security'] },
    { to: '/reports', label: 'Reports', roles: ['admin', 'security_supervisor', 'compliance'] },
    { to: '/audit', label: 'Audit Log', roles: ['admin', 'compliance', 'security_supervisor'] },
  ].filter((item) => item.roles.includes(role));

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 240, background: 'var(--primary)', color: 'white', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <h2 style={{ fontSize: 16 }}>IIML VMS</h2>
          <p style={{ fontSize: 12, opacity: 0.8 }}>{user?.name}</p>
          <p style={{ fontSize: 11, opacity: 0.6, textTransform: 'capitalize' }}>{role.replace('_', ' ')}</p>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} style={{ display: 'block', padding: '10px 20px', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: 14 }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '20px', marginTop: 'auto' }}>
          <button className="btn btn-outline" style={{ width: '100%', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('vms_token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('vms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_user');
    setUser(null);
    navigate('/login');
  };

  useEffect(() => {
    const stored = localStorage.getItem('vms_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/visits" element={<ProtectedRoute><Visits /></ProtectedRoute>} />
        <Route path="/visits/new" element={<ProtectedRoute><CreateVisit /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
        <Route path="/on-campus" element={<ProtectedRoute><OnCampus /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/bulk-upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
        <Route path="/blacklist" element={<ProtectedRoute><Blacklist /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
      </Routes>
    </AuthContext.Provider>
  );
}
