"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, LayoutDashboard, Target } from "lucide-react";

export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/dashboard/checks/analysis", {
      headers: { "Authorization": "Bearer dev-token" }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
           // Sort by failure count descending
           data.sort((a, b) => b.failure_count - a.failure_count);
           setAnalysisData(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const barData = useMemo(() => {
    const categoryFailures = { "OS": 0, "Network": 0, "Auth": 0, "Software": 0, "Hygiene": 0 };
    analysisData.forEach(d => {
      if (d.check_key.includes('bitlocker') || d.check_key.includes('windows')) categoryFailures["OS"] += d.failure_count;
      else if (d.check_key.includes('defender') || d.check_key.includes('password')) categoryFailures["Auth"] += d.failure_count;
      else if (d.check_key.includes('port') || d.check_key.includes('vpn')) categoryFailures["Network"] += d.failure_count;
      else categoryFailures["Hygiene"] += d.failure_count;
    });
    return Object.entries(categoryFailures)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [analysisData]);

  const totalFailures = useMemo(() => analysisData.reduce((acc, curr) => acc + curr.failure_count, 0), [analysisData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Checks Analysis</h1>
            <p className="text-neutral-400">Identify sweeping vulnerabilities across the fleet.</p>
         </div>
         <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl text-sm font-medium">
            <Target size={16} />
            <span>Target Mitigation</span>
         </div>
      </div>

      {loading ? (
        <div className="p-8 text-neutral-400 flex items-center gap-3"><Activity size={20} className="animate-spin"/> Loading analytics...</div>
      ) : analysisData.length === 0 ? (
        <div className="p-8 text-neutral-500 flex items-center gap-3"><LayoutDashboard size={20}/> No failures reported across the organization. You are fully secure!</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEADERBOARD */}
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
             <h3 className="font-semibold text-lg mb-4 text-white">Top Failing Checks</h3>
             <div className="space-y-3">
               {analysisData.slice(0, 10).map((d, i) => (
                  <div key={d.check_key} className="p-4 bg-neutral-950 border border-white/5 rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                           {i + 1}
                        </div>
                        <span className="font-mono text-neutral-200">{d.check_key.replace(/_/g, ' ').toUpperCase()}</span>
                     </div>
                     <div className="text-right">
                        <div className="text-rose-400 font-bold">{d.failure_count}</div>
                        <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Failures</div>
                     </div>
                  </div>
               ))}
             </div>
          </div>

          {/* BAR CHART */}
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
             <h3 className="font-semibold text-lg mb-4 text-white">Failures by Category</h3>
             <div className="flex-1 min-h-[350px]">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={barData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#525252" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#525252" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip cursor={{ fill: '#ffffff0a' }} contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                           {barData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#fbbf24', '#818cf8', '#10b981'][index % 5]} />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-600">Categories not resolvable...</div>
                )}
             </div>
             <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-200 text-center">
                 Total volume of active findings: <strong>{totalFailures}</strong>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
