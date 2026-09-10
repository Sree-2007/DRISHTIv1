import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, Shield } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('police@drishti.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const u = await login(email, password);
      if (!['POLICE', 'ADMIN'].includes(u.role)) {
        setError('Access restricted to police/admin'); return;
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-drishti-bg via-[#0d1424] to-[#0a0e1a]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-drishti-accent/15 mb-4">
            <Eye className="text-drishti-accent" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">DRISHTI</h1>
          <p className="text-gray-500 mt-1 text-sm">Dynamic Roadway Intelligence System</p>
        </div>
        <form onSubmit={submit} className="bg-drishti-card border border-drishti-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={18} className="text-drishti-accent" />
            <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">Police Command Access</span>
          </div>
          {error && <div className="mb-4 text-sm text-drishti-bad bg-drishti-bad/10 border border-drishti-bad/30 rounded-lg px-3 py-2">{error}</div>}
          <label className="block mb-4">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-drishti-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-drishti-accent" required />
          </label>
          <label className="block mb-6">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-drishti-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-drishti-accent" required />
          </label>
          <button disabled={busy} type="submit"
            className="w-full bg-drishti-accent hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition">
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="mt-6 text-xs text-gray-500 text-center">
            Demo: <span className="text-gray-300">police@drishti.io</span> / <span className="text-gray-300">password123</span>
          </div>
        </form>
      </div>
    </div>
  );
}
