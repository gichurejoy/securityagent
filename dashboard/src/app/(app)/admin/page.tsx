"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import { ShieldAlert, ServerCrash, Clock, Activity, ArrowUpRight, ArrowDownRight, ShieldCheck, Cpu } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, CartesianGrid, LineChart, Line, XAxis, YAxis } from "recharts";
import { API_BASE_URL } from "@/lib/api";

const MOCK_METRICS = {
  total: 26,
  scanned: 24,
  offline: 2,
  score: 92,
};

const RISK_DATA = [
  { name: "Secure", value: 18, color: "#10b981" },
  { name: "Low Risk", value: 4, color: "#fbbf24" },
  { name: "Medium Risk", value: 2, color: "#f97316" },
  { name: "High Risk", value: 1, color: "#ef4444" },
  { name: "Critical", value: 1, color: "#7f1d1d" },
];

const TREND_DATA = [
  { day: "Mon", score: 85 },
  { day: "Tue", score: 86 },
  { day: "Wed", score: 88 },
  { day: "Thu", score: 87 },
  { day: "Fri", score: 91 },
  { day: "Sat", score: 92 },
  { day: "Sun", score: 92 },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function OverviewPage() {
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [riskData, setRiskData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/dashboard/overview`, {
      headers: { "Authorization": "Bearer dev-token" }
    })
      .then(res => {
         if (!res.ok) throw new Error("Fetch failed");
         return res.json();
      })
      .then((data: any) => {
        setMetrics({
          total: data.total_devices || 0,
          scanned: data.scanned_24h || 0,
          offline: data.offline_devices || 0,
          score: data.org_score || 0
        });
        
        if (data.risk_distribution) {
            setRiskData(data.risk_distribution);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false); // Fallback to mock on error just in case
      });
  }, []);

  if (loading) {
    return <div className="text-neutral-400 p-8 flex items-center gap-3"><Activity size={16} className="animate-spin" /> Loading metrics...</div>;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Overview</h1>
            <p className="text-neutral-400">Your organization's real-time security posture.</p>
         </div>
         <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl text-sm font-medium">
            <Activity size={16} className="animate-pulse" />
            <span>Scanning Active</span>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <MetricCard 
            title="Total Endpoints" 
            value={metrics.total} 
            icon={Cpu} 
            trend="Active fleet" 
            positive={true} 
            color="indigo"
         />
         <MetricCard 
            title="Scanned (24h)" 
            value={metrics.scanned} 
            icon={ShieldCheck} 
            trend="Coverage" 
            positive={true}
            color="emerald"
         />
         <MetricCard 
            title="Offline Devices" 
            value={metrics.offline} 
            icon={Clock} 
            trend={metrics.offline > 0 ? "Action required" : "All clear"} 
            positive={metrics.offline === 0}
            color="rose"
         />
         <MetricCard 
            title="Avg Org Score" 
            value={metrics.score} 
            icon={Activity} 
            trend="Rolling avg" 
            positive={metrics.score >= 80}
            color="purple"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Risk Distribution Chart */}
         <motion.div variants={itemVariants} className="lg:col-span-1 bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-[80px] -z-10" />
             <h3 className="font-semibold text-lg mb-6">Risk Distribution</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={Object.entries(riskData).map(([name, value]) => ({
                           name,
                           value,
                           color: ({
                              "Secure": "#10b981",
                              "Low Risk": "#fbbf24",
                              "Medium Risk": "#f97316",
                              "High Risk": "#ef4444",
                              "Critical": "#7f1d1d"
                           } as any)[name] || "#ccc"
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                         {Object.entries(riskData).map(([name, value], index) => (
                           <Cell key={`cell-${index}`} fill={({
                              "Secure": "#10b981",
                              "Low Risk": "#fbbf24",
                              "Medium Risk": "#f97316",
                              "High Risk": "#ef4444",
                              "Critical": "#7f1d1d"
                           } as any)[name] || "#ccc"} />
                         ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex flex-col gap-2 mt-4">
                {Object.entries(riskData).map(([name, value]) => (
                   <div key={name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ({
                              "Secure": "#10b981",
                              "Low Risk": "#fbbf24",
                              "Medium Risk": "#f97316",
                              "High Risk": "#ef4444",
                              "Critical": "#7f1d1d"
                           } as any)[name] || "#ccc" }} />
                         <span className="text-neutral-300">{name}</span>
                      </div>
                      <span className="font-mono">{value}</span>
                   </div>
                ))}
             </div>
         </motion.div>

         {/* Score Trend & Alerts */}
         <div className="lg:col-span-2 space-y-6 flex flex-col">
            <motion.div variants={itemVariants} className="flex-1 bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
               <h3 className="font-semibold text-lg mb-6">Score Trend (7 Days)</h3>
               <div className="h-48 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={TREND_DATA}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                       <XAxis dataKey="day" stroke="#525252" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                       <YAxis stroke="#525252" domain={[60, 100]} tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                       <RechartsTooltip 
                         contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px' }}
                         itemStyle={{ color: '#fff' }} 
                       />
                       <Line 
                         type="monotone" 
                         dataKey="score" 
                         stroke="#818cf8" 
                         strokeWidth={3}
                         dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }}
                         activeDot={{ r: 6, fill: '#fff', stroke: '#818cf8' }}
                       />
                     </LineChart>
                   </ResponsiveContainer>
               </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex-1 bg-gradient-to-br from-rose-950/40 to-neutral-900/50 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-6 shadow-xl">
               <div className="flex items-center gap-2 mb-4">
                   <ShieldAlert className="text-rose-500" size={20} />
                   <h3 className="font-semibold text-lg text-rose-100">Critical Alerts</h3>
               </div>
               <div className="space-y-3">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start justify-between">
                     <div>
                        <h4 className="font-medium text-rose-200">Disk Encryption Disabled</h4>
                        <p className="text-sm text-rose-300/70 mt-1">DEVICE-A7X9 (Finance Dept) reported BitLocker is disabled on C: drive.</p>
                     </div>
                     <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded">2 mins ago</span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start justify-between">
                     <div>
                        <h4 className="font-medium text-rose-200">Antivirus Offline</h4>
                        <p className="text-sm text-rose-300/70 mt-1">DEVICE-B4M2 has disabled Windows Defender Real-Time Protection.</p>
                     </div>
                     <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded">1 hr ago</span>
                  </div>
               </div>
            </motion.div>
         </div>
      </div>
    </motion.div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend: string;
  positive: boolean;
  color: "indigo" | "emerald" | "rose" | "purple";
}

function MetricCard({ title, value, icon: Icon, trend, positive, color }: MetricCardProps) {
  const colorMap: Record<"indigo" | "emerald" | "rose" | "purple", string> = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <motion.div variants={itemVariants} className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
       <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-20 -mr-4 -mt-4 transition-opacity group-hover:opacity-40 bg-${color}-500`} />
       <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="text-sm font-medium text-neutral-400 tracking-wide">{title}</h3>
          <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
             <Icon size={16} />
          </div>
       </div>
       <div className="relative z-10">
          <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}>
             {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
             <span>{trend}</span>
          </div>
       </div>
    </motion.div>
  );
}
