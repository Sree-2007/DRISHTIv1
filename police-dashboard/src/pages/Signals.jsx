import { useEffect, useState } from 'react';
import api from '../lib/api';
import { socket } from '../lib/socket';
import { Bike, Car, Siren, Timer } from 'lucide-react';

function SignalCard({ signal, onUpdate }) {
  const total = signal.vehicleCount + signal.bikeCount;
  const busy = total > 150;

  const adjust = async (payload) => {
    const { data } = await api.patch(`/signals/${signal.id}/adjust`, payload);
    onUpdate(data);
  };
  const ambulance = async () => {
    const { data } = await api.post(`/signals/${signal.id}/ambulance`);
    onUpdate(data);
  };

  return (
    <div className={`bg-drishti-card border rounded-xl p-4 transition ${
      signal.isAmbulanceMode ? 'border-drishti-bad shadow-lg shadow-drishti-bad/20' : 'border-drishti-border'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-sm">{signal.intersectionName}</div>
          <div className="text-[11px] text-gray-500">{signal.zone?.name}</div>
        </div>
        <div className={`text-[10px] px-2 py-0.5 rounded-full ${
          signal.isAmbulanceMode ? 'bg-drishti-bad text-white' : busy ? 'bg-drishti-warn/20 text-drishti-warn' : 'bg-drishti-good/20 text-drishti-good'
        }`}>
          {signal.isAmbulanceMode ? 'AMBULANCE' : busy ? 'BUSY' : 'OK'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-black/30 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[10px] text-gray-500"><Car size={10} /> Vehicles</div>
          <div className="text-lg font-bold">{signal.vehicleCount}</div>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[10px] text-gray-500"><Bike size={10} /> Bikes</div>
          <div className="text-lg font-bold">{signal.bikeCount}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-gray-400">Phase: <span className="text-white font-medium">{signal.currentPhase}</span></span>
        <span className="flex items-center gap-1 text-gray-400"><Timer size={12} /> {signal.greenTimeSeconds}s</span>
      </div>

      <div className="flex gap-1.5">
        <button onClick={() => adjust({ greenTimeSeconds: signal.greenTimeSeconds + 10 })}
          className="flex-1 text-[11px] bg-white/5 hover:bg-white/10 py-1.5 rounded">+10s</button>
        <button onClick={() => adjust({ phase: 'BIKE_PRIORITY' })}
          className="flex-1 text-[11px] bg-white/5 hover:bg-white/10 py-1.5 rounded">Bike</button>
        <button onClick={ambulance}
          className="flex-1 text-[11px] bg-drishti-bad/20 hover:bg-drishti-bad/30 text-drishti-bad py-1.5 rounded flex items-center justify-center gap-1">
          <Siren size={11} /> SOS
        </button>
      </div>
    </div>
  );
}

export default function Signals() {
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    api.get('/signals').then(r => setSignals(r.data));
    const onUpdate = (s) => setSignals(prev => prev.map(x => x.id === s.id ? { ...x, ...s } : x));
    socket.on('signal:update', onUpdate);
    return () => socket.off('signal:update', onUpdate);
  }, []);

  const onUpdate = (s) => setSignals(prev => prev.map(x => x.id === s.id ? { ...x, ...s } : x));

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Traffic Signals</h1>
        <p className="text-gray-500 text-sm mt-1">Live intersection control · adaptive green timing</p>
      </header>
      <div className="grid grid-cols-3 gap-4">
        {signals.map(s => <SignalCard key={s.id} signal={s} onUpdate={onUpdate} />)}
      </div>
    </div>
  );
}
