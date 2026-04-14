"use client";

import dynamic from "next/dynamic";
import MetricsPanel from "@/components/MetricsPanel";

const MapDashboard = dynamic(() => import("@/components/MapDashboard"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex h-screen w-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 gap-4">
      {/* Metrics Sidebar */}
      <MetricsPanel />
      
      {/* Main Map Content */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">RushRoute</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Intelligent Dispatch System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">Optimization Engine</div>
                <div className="text-sm font-semibold text-green-400 flex items-center gap-1 justify-end">
                   <span>OR-Tools VRP Active</span>
                   <span className="relative flex h-2 w-2 ml-1">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                   </span>
                </div>
             </div>
          </div>
        </header>

        {/* Map Container Wrapper */}
        <div className="flex-1 h-full min-h-0 relative">
          <MapDashboard />
        </div>
      </div>
    </main>
  );
}
