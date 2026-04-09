"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Activity } from "lucide-react";

export default function TrendsPage() {
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/dashboard/trends", { headers: { "Authorization": "Bearer dev-token" } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setTrendData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Trends & History</h1>
            <p className="text-neutral-400">Track org-wide compliance and security posture over time.</p>
         </div>
      </div>

      {loading ? (
        <div className="p-8 text-neutral-400 flex items-center gap-3"><Activity size={20} className="animate-spin"/> Loading trends...</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
             <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="text-indigo-400" />
                <h3 className="font-semibold text-lg text-white">Org Security Score Over Time</h3>
             </div>
             <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="date" stroke="#525252" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={30} />
                      <YAxis stroke="#525252" domain={[0, 100]} tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="average_score" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
             <h3 className="font-semibold text-lg text-white mb-6">Device Compliance Rate (%)</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="date" stroke="#525252" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={30} />
                      <YAxis stroke="#525252" domain={[0, 100]} tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="compliance_rate" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
