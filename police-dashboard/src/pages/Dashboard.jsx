import { useEffect, useState } from 'react';
import api from '../lib/api';
import { socket } from '../lib/socket';
import { FileWarning, Map, TrafficCone, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-drishti-card border border-drishti-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
        <Icon size={16} className={accent} />
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [liveReports, setLiveReports] = useState([]);
  const [signalTrend, setSignalTrend] = useState([]);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data));
    api.get('/reports?status=PENDING').then(r => setLiveReports(r.data.slice(0, 5)));

    const onReport = (r) => setLiveReports(prev => [r, ...prev].slice(0, 5));
    const onSignal = (s) => setSignalTrend(prev => [...prev, { t: new Date().toLocaleTimeString(), v: s.vehicleCount + s.bikeCount }].slice(-20));

    socket.on('hazard:reported', onReport);
    socket.on('signal:update', onSignal);
    return () => { socket.off('hazard:reported', onReport); socket.off('signal:update', onSignal); };
  }, []);

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Command Center</h1>
        <p className="text-gray-500 text-sm mt-1">Live operational overview</p>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat icon={FileWarning}  label="Reports Today"   value={stats?.totalReportsToday ?? '–'} accent="text-drishti-accent" />
        <Stat icon={Map}          label="Active Zones"    value={stats?.activeZones ?? '–'}      accent="text-drishti-warn" />
        <Stat icon={TrafficCone}  label="Avg Vehicle Load" value={stats?.avgCongestion ?? '–'}   accent="text-drishti-good" />
        <Stat icon={Zap}          label="Pending Review"  value={stats?.pendingReports ?? '–'}   accent="text-drishti-bad" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-drishti-card border border-drishti-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Live Traffic Density (last signals)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={signalTrend}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="t" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip contentStyle={{ background: '#131826', border: '1px solid #1f2937' }} />
                <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-drishti-card border border-drishti-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Live Incoming Reports</h2>
          <div className="space-y-3">
            {liveReports.length === 0 && <div className="text-sm text-gray-500">No reports yet.</div>}
            {liveReports.map(r => (
              <div key={r.id} className="border border-drishti-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-drishti-accent">{r.type}</span>
                  <span className="text-[10px] text-gray-500">{new Date(r.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="text-xs text-gray-400 truncate">{r.description}</div>
                <div className="text-[10px] text-gray-600 mt-1">by {r.reporter?.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
