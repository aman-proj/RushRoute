"use client";

import { useSocket } from '../hooks/useSocket';

export default function MetricsPanel() {
  const { state } = useSocket('ws://localhost:8000/ws');

  if (!state) return null;

  // Derive metrics
  const activeRiders = state.riders.filter(r => r.status === 'enroute').length;
  const pendingOrders = state.orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = state.orders.filter(o => o.status === 'delivered').length;
  
  // Simulated unoptimized stats comparison for visual effect
  // Let's assume unoptimized would need 1 rider per order
  const totalActiveOrders = state.orders.filter(o => ['pending', 'batched', 'enroute'].includes(o.status)).length;
  
  const optimizedDistanceSaved = activeRiders > 0 ? Math.round((totalActiveOrders - activeRiders) * 15.4) : 0; // arbitrary multiplier for km

  return (
    <div className="w-80 flex flex-col gap-4 bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 h-full shadow-2xl">
      <div className="flex flex-col mb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Command Center</span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-0.5"></span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">Live routing & batching intelligence.</p>
      </div>

      {/* METRICS SHOWCASE */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Active Riders" value={activeRiders} highlight="text-green-400" />
        <MetricCard label="Pending Orders" value={pendingOrders} highlight="text-orange-400" />
        <MetricCard label="Delivered" value={deliveredOrders} highlight="text-blue-400" />
        <MetricCard label="Active Orders" value={totalActiveOrders} highlight="text-white" />
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2" />

      {/* ALGORITHM COMPARISON */}
      <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold">Algorithm Impact</h3>
      <div className="flex flex-col gap-3 bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Optimized Riders</span>
          <span className="text-lg font-bold text-green-400">{activeRiders} <span className="text-xs text-slate-500 line-through ml-1">{totalActiveOrders}</span></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Distance Saved</span>
          <span className="text-lg font-bold text-emerald-400">{optimizedDistanceSaved} km</span>
        </div>
      </div>

      {/* RECENT BATCHES FEED */}
      <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mt-2">Active Batches</h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {state.riders.filter(r => r.active_route.length > 0).map((r, i) => (
          <div key={r.id} className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-3">
            <div className="flex justify-between">
              <span className="text-xs font-mono text-slate-300">Rider {r.id}</span>
              <span className="text-[10px] uppercase font-bold text-blue-400">Enroute</span>
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span>Stops: {r.active_route.length}</span>
              <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.max(10, 100 - r.active_route.length * 10)}%` }}></div>
              </div>
            </div>
          </div>
        ))}
        {state.riders.filter(r => r.active_route.length > 0).length === 0 && (
          <div className="text-sm text-slate-500 text-center py-4 italic">No active batches</div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string, value: number, highlight: string }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col justify-between aspect-[4/3]">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-bold ${highlight}`}>{value}</span>
    </div>
  );
}
