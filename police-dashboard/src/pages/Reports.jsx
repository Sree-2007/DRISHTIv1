import { useEffect, useState } from 'react';
import api from '../lib/api';
import { socket } from '../lib/socket';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('PENDING');

  const load = () => api.get('/reports').then(r => setReports(r.data));

  useEffect(() => {
    load();
    const onReport = () => load();
    socket.on('hazard:reported', onReport);
    return () => socket.off('hazard:reported', onReport);
  }, []);

  const filtered = reports.filter(r => filter === 'ALL' || r.status === filter);

  const act = async (id, action) => {
    await api.patch(`/reports/${id}/verify`, { action });
    load();
  };

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports Queue</h1>
          <p className="text-gray-500 text-sm mt-1">Verify citizen and driver submissions</p>
        </div>
        <div className="flex gap-2">
          {['PENDING', 'VERIFIED', 'REJECTED', 'ALL'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                filter === f ? 'border-drishti-accent bg-drishti-accent/10 text-drishti-accent' : 'border-drishti-border text-gray-400 hover:text-white'
              }`}>{f}</button>
          ))}
        </div>
      </header>

      <div className="bg-drishti-card border border-drishti-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Description</th>
              <th className="text-left px-4 py-3">Zone</th>
              <th className="text-left px-4 py-3">Reporter</th>
              <th className="text-left px-4 py-3">AI</th>
              <th className="text-left px-4 py-3">Time</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t border-drishti-border hover:bg-white/5">
                <td className="px-4 py-3"><span className="text-xs font-bold text-drishti-accent">{r.type}</span></td>
                <td className="px-4 py-3 max-w-xs truncate">{r.description}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.zone?.name || '—'}</td>
                <td className="px-4 py-3 text-xs">
                  <div>{r.reporter?.name}</div>
                  <div className="text-gray-600">trust {r.reporter?.trustScore}</div>
                </td>
                <td className="px-4 py-3 text-xs">{r.aiConfidence?.toFixed(0)}%</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    r.status === 'VERIFIED' ? 'bg-drishti-good/20 text-drishti-good' :
                    r.status === 'REJECTED' ? 'bg-drishti-bad/20 text-drishti-bad' :
                    'bg-drishti-warn/20 text-drishti-warn'
                  }`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === 'PENDING' ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => act(r.id, 'VERIFY')} className="p-1.5 bg-drishti-good/15 rounded-lg text-drishti-good hover:bg-drishti-good/25">
                        <CheckCircle2 size={14} />
                      </button>
                      <button onClick={() => act(r.id, 'REJECT')} className="p-1.5 bg-drishti-bad/15 rounded-lg text-drishti-bad hover:bg-drishti-bad/25">
                        <XCircle size={14} />
                      </button>
                    </div>
                  ) : <span className="text-gray-600 text-xs">—</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">No reports in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
