import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../lib/api';
import { socket } from '../lib/socket';
import { CheckCircle2, XCircle } from 'lucide-react';

const statusColors = {
  NORMAL: 'bg-drishti-good', WATERLOGGED: 'bg-drishti-accent',
  BLOCKED: 'bg-gray-700', RALLY: 'bg-drishti-warn', ACCIDENT: 'bg-drishti-bad'
};

const statusBorder = {
  NORMAL: '#10b981', WATERLOGGED: '#3b82f6', BLOCKED: '#374151',
  RALLY: '#f59e0b', ACCIDENT: '#ef4444'
};

export default function ZoneControl() {
  const [zones, setZones] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get('/zones').then(r => { setZones(r.data); if (r.data[0]) setSelected(r.data[0]); });
    const onReport = () => api.get('/zones').then(r => setZones(r.data));
    socket.on('hazard:reported', onReport);
    return () => socket.off('hazard:reported', onReport);
  }, []);

  useEffect(() => {
    if (selected) api.get(`/zones/${selected.id}`).then(r => setDetail(r.data));
  }, [selected]);

  const verify = async (id, action) => {
    await api.patch(`/reports/${id}/verify`, { action });
    api.get(`/zones/${selected.id}`).then(r => setDetail(r.data));
  };

  const center = selected ? [
    (selected.boundary[0][0] + selected.boundary[2][0]) / 2,
    (selected.boundary[0][1] + selected.boundary[2][1]) / 2
  ] : [19.076, 72.8777];

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r border-drishti-border bg-drishti-card p-4 overflow-y-auto">
        <h1 className="text-lg font-bold mb-4">Zones</h1>
        <div className="space-y-2">
          {zones.map(z => (
            <button key={z.id} onClick={() => setSelected(z)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                selected?.id === z.id ? 'border-drishti-accent bg-drishti-accent/10' : 'border-drishti-border hover:bg-white/5'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{z.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${statusColors[z.currentStatus]}`}>
                  {z.currentStatus}
                </span>
              </div>
              <div className="text-[11px] text-gray-500">
                {z._count.reports} reports · {z.activeOfficer?.name || 'No officer'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-[55%]">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {zones.map(z => (
              <Rectangle key={z.id} bounds={z.boundary}
                pathOptions={{
                  color: statusBorder[z.currentStatus],
                  fillColor: statusBorder[z.currentStatus],
                  fillOpacity: selected?.id === z.id ? 0.25 : 0.1,
                  weight: selected?.id === z.id ? 3 : 1
                }}
                eventHandlers={{ click: () => setSelected(z) }}
              />
            ))}
          </MapContainer>
        </div>

        <div className="flex-1 overflow-y-auto bg-drishti-bg p-6">
          {detail ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{detail.name}</h2>
                  <p className="text-xs text-gray-500">Status: {detail.currentStatus} · Officer: {detail.assignments[0]?.officer?.name || 'Unassigned'}</p>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Active Reports</h3>
              <div className="space-y-2">
                {detail.reports.length === 0 && <div className="text-sm text-gray-500">No reports for this zone.</div>}
                {detail.reports.map(r => (
                  <div key={r.id} className="bg-drishti-card border border-drishti-border rounded-lg p-3 flex items-center gap-4">
                    {r.imageUrl && <img src={r.imageUrl} className="w-16 h-16 object-cover rounded" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-drishti-accent uppercase">{r.type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          r.status === 'VERIFIED' ? 'bg-drishti-good/20 text-drishti-good' :
                          r.status === 'REJECTED' ? 'bg-drishti-bad/20 text-drishti-bad' :
                          'bg-drishti-warn/20 text-drishti-warn'
                        }`}>{r.status}</span>
                      </div>
                      <div className="text-sm mt-1">{r.description}</div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        by {r.reporter.name} · trust {r.reporter.trustScore} · AI {r.aiConfidence?.toFixed(0)}%
                      </div>
                    </div>
                    {r.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => verify(r.id, 'VERIFY')}
                          className="p-2 bg-drishti-good/15 hover:bg-drishti-good/25 rounded-lg text-drishti-good">
                          <CheckCircle2 size={16} />
                        </button>
                        <button onClick={() => verify(r.id, 'REJECT')}
                          className="p-2 bg-drishti-bad/15 hover:bg-drishti-bad/25 rounded-lg text-drishti-bad">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : <div className="text-gray-500">Select a zone</div>}
        </div>
      </div>
    </div>
  );
}
