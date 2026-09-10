import { useEffect, useState } from 'react';
import api from '../lib/api';
import { X, Siren, RotateCcw, Hand, Zap, AlertOctagon, Clock } from 'lucide-react';

const PHASES = [
  { key: 'NORTH', label: 'North', arrow: '↑' },
  { key: 'SOUTH', label: 'South', arrow: '↓' },
  { key: 'EAST',  label: 'East',  arrow: '→' },
  { key: 'WEST',  label: 'West',  arrow: '←' }
];

export default function SignalControlModal({ signal, onClose, onUpdate }) {
  const [green, setGreen] = useState(signal.greenTimeSeconds);
  const [phase, setPhase] = useState(signal.currentPhase);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setGreen(signal.greenTimeSeconds);
    setPhase(signal.currentPhase);
  }, [signal.id, signal.greenTimeSeconds, signal.currentPhase]);

  const apply = async (payload) => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/signals/${signal.id}/adjust`, payload);
      onUpdate(data);
    } finally { setBusy(false); }
  };

  const toggleManual = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/signals/${signal.id}/manual`, { enabled: !signal.isManualMode });
      onUpdate(data);
    } finally { setBusy(false); }
  };

  const forceRed = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/signals/${signal.id}/force-red`);
      onUpdate(data);
    } finally { setBusy(false); }
  };

  const reset = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/signals/${signal.id}/reset`);
      onUpdate(data);
    } finally { setBusy(false); }
  };

  const ambulance = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/signals/${signal.id}/ambulance`);
      onUpdate(data);
    } finally { setBusy(false); }
  };

  const saveGreen = () => apply({ greenTimeSeconds: green });
  const setPhaseManual = (p) => { setPhase(p); apply({ phase: p, isManualMode: true }); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-drishti-card border border-drishti-border rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-drishti-border">
          <div>
            <h2 className="text-lg font-bold">{signal.intersectionName}</h2>
            <p className="text-xs text-gray-500">{signal.zone?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {signal.isAmbulanceMode && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-drishti-bad text-white font-bold flex items-center gap-1">
                <Siren size={11} /> AMBULANCE
              </span>
            )}
            {signal.isManualMode && !signal.isAmbulanceMode && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-drishti-warn/20 text-drishti-warn font-bold flex items-center gap-1">
                <Hand size={11} /> MANUAL
              </span>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* Manual mode toggle */}
          <div className="flex items-center justify-between bg-black/30 rounded-xl p-4 border border-drishti-border">
            <div>
              <div className="text-sm font-semibold">Manual Override Mode</div>
              <div className="text-[11px] text-gray-500">
                {signal.isManualMode ? 'Simulator is paused. You control this signal.' : 'Adaptive algorithm is running.'}
              </div>
            </div>
            <button
              onClick={toggleManual}
              disabled={busy}
              className={`relative w-14 h-8 rounded-full transition ${signal.isManualMode ? 'bg-drishti-warn' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${signal.isManualMode ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Phase selector */}
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">Force Phase</div>
            <div className="grid grid-cols-4 gap-2">
              {PHASES.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPhaseManual(p.key)}
                  disabled={busy}
                  className={`py-3 rounded-xl border text-center transition ${
                    phase === p.key
                      ? 'border-drishti-accent bg-drishti-accent/15 text-drishti-accent'
                      : 'border-drishti-border hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="text-2xl leading-none">{p.arrow}</div>
                  <div className="text-[11px] mt-1 font-semibold">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Green time slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Clock size={12} /> Green Time
              </div>
              <div className="text-sm font-bold text-drishti-accent">{green}s</div>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={green}
              onChange={e => setGreen(parseInt(e.target.value))}
              onMouseUp={saveGreen}
              onTouchEnd={saveGreen}
              className="w-full accent-drishti-accent"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>5s</span><span>30s</span><span>60s</span><span>90s</span><span>120s</span>
            </div>
            <div className="flex gap-2 mt-3">
              {[15, 30, 45, 60, 90].map(v => (
                <button
                  key={v}
                  onClick={() => { setGreen(v); apply({ greenTimeSeconds: v }); }}
                  disabled={busy}
                  className="flex-1 text-[11px] bg-white/5 hover:bg-white/10 py-1.5 rounded-lg"
                >
                  {v}s
                </button>
              ))}
            </div>
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-black/30 rounded-lg py-3">
              <div className="text-[10px] text-gray-500 uppercase">Vehicles</div>
              <div className="text-xl font-bold">{signal.vehicleCount}</div>
            </div>
            <div className="bg-black/30 rounded-lg py-3">
              <div className="text-[10px] text-gray-500 uppercase">Bikes</div>
              <div className="text-xl font-bold">{signal.bikeCount}</div>
            </div>
            <div className="bg-black/30 rounded-lg py-3">
              <div className="text-[10px] text-gray-500 uppercase">Load</div>
              <div className="text-xl font-bold">
                {signal.vehicleCount + signal.bikeCount}
              </div>
            </div>
          </div>

          {/* Emergency actions */}
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">Emergency Actions</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={ambulance}
                disabled={busy}
                className="py-3 rounded-xl border border-drishti-bad/40 bg-drishti-bad/10 hover:bg-drishti-bad/20 text-drishti-bad font-semibold text-xs flex flex-col items-center gap-1"
              >
                <Siren size={16} /> Ambulance Mode
              </button>
              <button
                onClick={forceRed}
                disabled={busy}
                className="py-3 rounded-xl border border-drishti-warn/40 bg-drishti-warn/10 hover:bg-drishti-warn/20 text-drishti-warn font-semibold text-xs flex flex-col items-center gap-1"
              >
                <AlertOctagon size={16} /> Force All Red
              </button>
              <button
                onClick={reset}
                disabled={busy}
                className="py-3 rounded-xl border border-drishti-good/40 bg-drishti-good/10 hover:bg-drishti-good/20 text-drishti-good font-semibold text-xs flex flex-col items-center gap-1"
              >
                <RotateCcw size={16} /> Reset to Auto
              </button>
            </div>
          </div>

          {/* Big apply button */}
          <button
            onClick={saveGreen}
            disabled={busy}
            className="w-full bg-drishti-accent hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Zap size={16} /> Apply Green Timing ({green}s)
          </button>
        </div>
      </div>
    </div>
  );
}
