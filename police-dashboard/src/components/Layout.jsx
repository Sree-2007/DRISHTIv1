import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../lib/socket';
import { LayoutDashboard, Map, TrafficCone, FileWarning, BarChart3, LogOut, Eye } from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/zones', icon: Map, label: 'Zones' },
  { to: '/signals', icon: TrafficCone, label: 'Signals' },
  { to: '/reports', icon: FileWarning, label: 'Reports' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();
    return () => socket.disconnect();
  }, []);

  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-drishti-card border-r border-drishti-border flex flex-col">
        <div className="px-5 py-5 border-b border-drishti-border flex items-center gap-2">
          <Eye className="text-drishti-accent" size={22} />
          <div>
            <div className="font-bold tracking-tight">DRISHTI</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Police Command</div>
          </div>
        </div>
        <nav className="flex-1 py-3">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-drishti-accent/15 text-drishti-accent' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}>
              <n.icon size={16} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-drishti-border">
          <div className="text-xs text-gray-500 mb-1">Signed in as</div>
          <div className="text-sm font-medium truncate">{user?.name}</div>
          <div className="text-[10px] text-drishti-accent uppercase mb-3">{user?.role}</div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 text-xs bg-white/5 hover:bg-white/10 py-2 rounded-lg">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
