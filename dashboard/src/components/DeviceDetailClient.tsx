"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Monitor, ShieldAlert, CheckCircle2, AlertTriangle, Crosshair, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export default function DeviceDetailClient() {
   const params = useParams();
   const router = useRouter();
   const deviceId = params.id as string;
   
   const [deviceData, setDeviceData] = useState<any>(null);
   const [historyData, setHistoryData] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [commandQueued, setCommandQueued] = useState(false);

   useEffect(() => {
      Promise.all([
         fetch(`http://127.0.0.1:8000/api/v1/dashboard/devices/${deviceId}`, { headers: { "Authorization": "Bearer dev-token" } }).then(r => r.ok ? r.json() : null),
         fetch(`http://127.0.0.1:8000/api/v1/dashboard/devices/${deviceId}/history`, { headers: { "Authorization": "Bearer dev-token" } }).then(r => r.ok ? r.json() : [])
      ]).then(([deviceRes, historyRes]) => {
         setDeviceData(deviceRes);
         setHistoryData(Array.isArray(historyRes) ? historyRes.reverse() : []); // Chronological
         setLoading(false);
      }).catch(err => {
         console.error(err);
         setLoading(false);
      });
   }, [deviceId]);

   const handleScanNow = async () => {
      setCommandQueued(true);
      try {
         await fetch("http://127.0.0.1:8000/api/v1/dashboard/commands", {
            method: "POST",
            headers: { 
               "Content-Type": "application/json",
               "Authorization": "Bearer dev-token" 
            },
            body: JSON.stringify({ device_id: parseInt(deviceId), command_type: "scan_now" })
         });
      } catch (err) {
         console.error(err);
      }
      setTimeout(() => setCommandQueued(false), 3000); // Visual feedback
   };

   // Hooks must be at the top level
   const radarData = useMemo(() => {
     if (!deviceData?.latest_scan?.raw_json || !deviceData?.device) return [];
     const d = deviceData.device;
     return [
        { subject: 'OS', A: d.risk_score >= 80 ? 90 : 40, fullMark: 100 },
        { subject: 'Network', A: d.risk_score >= 90 ? 100 : 70, fullMark: 100 },
        { subject: 'Auth', A: d.risk_score >= 50 ? 90 : 20, fullMark: 100 },
        { subject: 'Software', A: d.risk_score >= 70 ? 80 : 30, fullMark: 100 },
        { subject: 'Hygiene', A: d.risk_score >= 60 ? 95 : 55, fullMark: 100 },
     ];
   }, [deviceData]);

   const checks = useMemo(() => deviceData?.latest_scan?.raw_json || [], [deviceData?.latest_scan?.raw_json]);

   const trend = useMemo(() => historyData.map((h, i) => ({
      name: `Scan ${i+1}`,
      score: h.score,
      date: new Date(h.scanned_at).toLocaleDateString()
   })), [historyData]);

   if (loading) return <div className="p-8 text-neutral-400 max-w-7xl mx-auto flex items-center gap-3 h-screen"><RefreshCw size={20} className="animate-spin" />Loading device...</div>;
   if (!deviceData || !deviceData.device) return <div className="p-8 text-rose-400 mt-10 h-screen">404 - Device not found.</div>;

   const d = deviceData.device;

   return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
         {/* HEADER */}
         <div className="flex items-center gap-4 text-sm text-neutral-500 mb-2 cursor-pointer hover:text-white transition-colors" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Back to Endpoints
         </div>
         
         <div className="flex flex-col md:flex-row items-start md:items-end justify-between bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-[80px] -z-10" />
            
            <div className="flex items-start gap-4">
               <div className="p-4 bg-neutral-950 rounded-xl border border-white/10 shadow-inner">
                  <Monitor size={40} className="text-indigo-400" />
               </div>
               <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{d.hostname}</h1>
                  <div className="flex items-center gap-4 text-sm text-neutral-400 flex-wrap">
                     <span>{d.employee_name || "Unassigned User"} ({d.employee_email || "No Email"})</span>
                     <span className="hidden md:inline text-neutral-700">|</span>
                     <span>{d.os_platform} {d.os_version}</span>
                     <span className="hidden md:inline text-neutral-700">|</span>
                     <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 rounded-full text-xs py-0.5">Agent v{d.agent_version || '1.0.0'}</span>
                  </div>
               </div>
            </div>

            <div className="mt-6 md:mt-0 flex gap-4 items-center w-full md:w-auto">
               <div className="text-right flex-1 md:mr-4">
                  <div className="text-sm text-neutral-400 mb-1">Overall Risk Score</div>
                  <div className={`text-4xl font-bold font-mono ${d.risk_score >= 90 ? 'text-emerald-400' : d.risk_score >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                     {d.risk_score || 0} <span className="text-lg opacity-50">/ 100</span>
                  </div>
               </div>
               
               <button 
                  onClick={handleScanNow}
                  disabled={commandQueued}
                  className="bg-indigo-600 hover:bg-indigo-500 focus:scale-95 disabled:opacity-50 text-white px-5 py-3 rounded-lg flex items-center gap-2 font-medium transition-all"
               >
                  {commandQueued ? <RefreshCw size={18} className="animate-spin" /> : <Crosshair size={18} />}
                  <span className="hidden sm:inline">{commandQueued ? "Command Queued" : "Scan Now"}</span>
               </button>
            </div>
         </div>

         {/* CHARTS ROW */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-neutral-900/50 border border-white/5 rounded-2xl p-6 shadow-lg">
               <h3 className="font-semibold mb-4 text-white">Risk Profile Tracker</h3>
               <div className="h-64 min-h-[256px]">
                  {radarData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                           <PolarGrid stroke="#333" />
                           <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11 }} />
                           <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                           <Radar name="Score" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
                           <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#333' }} itemStyle={{ color: '#818cf8' }} />
                        </RadarChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="h-full flex items-center justify-center text-sm text-neutral-600">No category breakdown</div>
                  )}
               </div>
            </div>

            <div className="lg:col-span-2 bg-neutral-900/50 border border-white/5 rounded-2xl p-6 shadow-lg">
               <h3 className="font-semibold mb-4 text-white">Device Score Timeline</h3>
               <div className="h-64 min-h-[256px]">
                  {trend.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                           <XAxis dataKey="date" stroke="#525252" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                           <YAxis stroke="#525252" domain={[0, 100]} tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                           <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '8px' }} />
                           <Line type="stepAfter" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="h-full flex items-center justify-center text-sm text-neutral-600">No historical scans...</div>
                  )}
               </div>
            </div>
         </div>

         {/* CHECKS LIST */}
         <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 shadow-lg">
             <h3 className="font-semibold mb-4 text-white flex items-center gap-2 text-lg">
               Latest Telemetry Checks
               <span className="text-xs bg-neutral-800 border border-neutral-700 px-2 py-1 rounded-md text-neutral-400 font-normal">
                 {checks.length} points
               </span>
             </h3>
             <div className="space-y-3">
               {checks.length === 0 && <div className="text-neutral-500 text-sm">No checks reported by agent yet. Awaiting first scan.</div>}
               {checks.map((check: any, i: number) => (
                  <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${
                     check.status === 'fail' ? 'bg-rose-500/10 border-rose-500/20' : 
                     check.status === 'warn' ? 'bg-amber-500/10 border-amber-500/20' : 
                     'bg-neutral-950 border-white/5'
                  }`}>
                     <div className="mt-1">
                        {check.status === 'fail' ? <ShieldAlert size={20} className="text-rose-400" /> :
                         check.status === 'warn' ? <AlertTriangle size={20} className="text-amber-400" /> :
                         <CheckCircle2 size={20} className="text-emerald-400" />}
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-medium text-neutral-200">{check.check_key.replace(/_/g, ' ').toUpperCase()}</span>
                           <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">{check.category || "General"}</span>
                        </div>
                        <p className={`text-sm ${check.status === 'fail' ? 'text-rose-200/80' : 'text-neutral-500'}`}>{check.detail}</p>
                     </div>
                  </div>
               ))}
             </div>
         </div>
      </div>
   );
}
