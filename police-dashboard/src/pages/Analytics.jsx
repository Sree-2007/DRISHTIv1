import { useEffect, useState } from 'react';
import api from '../lib/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Analytics() {
  const [reports, setReports] = useState([]);

  useEffect(() => { api.get('/reports').then(r => setReports(r.data)); }, []);

  // Reports per hour (last 12 hours)
  const now = Date.now();
  const hours = Array.from({ length: 12 }, (_, i) => {
    const t = new Date(now - (11 - i) * 3600 * 1000);
    return { hour: t.getHours() + ':00', count: 0 };
  });
  reports.forEach(r => {
    const h = new Date(r.createdAt).getHours();
    const idx = hours.findIndex(x => parseInt(x.hour) === h);
    if (idx >= 0) hours[idx].count++;
  });

  // By type
  const byType = ['ACCIDENT', 'WATERLOGGING', 'BLOCKAGE', 'RALLY'].map(t => ({
    type: t, count: reports.filter(r => r.type === t).length
  }));

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Trends and insights from live data</p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-drishti-card border border-drishti-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Reports per Hour (last 12h)</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={hours}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip contentStyle={{ background: '#131826', border: '1px solid #1f2937' }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-drishti-card border border-drishti-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Reports by Hazard Type</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byType}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="type" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip contentStyle={{ background: '#131826', border: '1px solid #1f2937' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
