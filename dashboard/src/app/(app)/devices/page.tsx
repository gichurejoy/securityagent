"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Monitor, Search, Filter, MoreHorizontal, ShieldAlert, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/dashboard/devices`, {
      headers: { "Authorization": "Bearer dev-token" }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setDevices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusText = (score: number) => {
     if (score >= 90) return "Secure";
     if (score >= 70) return "Low Risk";
     return "High Risk";
  };

  const devicesData = useMemo(() => devices, [devices]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Endpoints</h1>
            <p className="text-neutral-400">Manage and monitor all enrolled devices.</p>
         </div>
         <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all">
            Enroll New Device
         </button>
      </div>

      <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
         <div className="p-4 border-b border-white/5 flex gap-4">
            <div className="flex-1 flex items-center bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 focus-within:ring-2 ring-indigo-500/50 transition-all">
               <Search size={16} className="text-neutral-500" />
               <input type="text" placeholder="Search by hostname or employee..." className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white placeholder-neutral-500" />
            </div>
            <button className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-white/10 px-4 py-2 rounded-lg text-sm text-neutral-300 font-medium transition-colors">
               <Filter size={16} />
               <span>Filters</span>
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-white/5 bg-neutral-950/50 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                     <th className="p-4 rounded-tl-xl">Hostname</th>
                     <th className="p-4">Assigned To</th>
                     <th className="p-4">Work Email</th>
                     <th className="p-4">OS Version</th>
                     <th className="p-4">Risk Score</th>
                     <th className="p-4">Last Seen</th>
                     <th className="p-4 text-right rounded-tr-xl">Actions</th>
                  </tr>
               </thead>
               <tbody className="text-sm">
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Loading devices...</td></tr>
                  ) : devicesData.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No devices found.</td></tr>
                  ) : devicesData.map((device: any) => {
                     const statusText = getStatusText(device.risk_score || 0);
                     return (
                     <tr 
                        key={device.id} 
                        onClick={() => router.push(`/devices/${device.id}`)}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                     >
                        <td className="p-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-neutral-800 rounded-lg border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                 <Monitor size={16} className="text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                              </div>
                              <span className="font-medium text-neutral-200">{device.hostname}</span>
                           </div>
                        </td>
                        <td className="p-4">
                           <div className="flex flex-col">
                              <span className="text-neutral-200">{device.employee_name || "Unknown User"}</span>
                           </div>
                        </td>
                        <td className="p-4">
                           <span className="text-neutral-400 text-sm font-mono">{device.employee_email || "Not enrolled"}</span>
                        </td>
                        <td className="p-4 text-neutral-400">{device.os_platform} {device.os_version}</td>
                        <td className="p-4">
                           <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${(device.risk_score || 0) >= 90 ? 'text-emerald-400' : (device.risk_score || 0) >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                                 {device.risk_score || 0}
                              </span>
                              <div className={`px-2 py-0.5 rounded text-xs tracking-wide font-medium border ${
                                 (device.risk_score || 0) >= 90 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 
                                 (device.risk_score || 0) >= 70 ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 
                                 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                              }`}>
                                 {statusText}
                              </div>
                           </div>
                        </td>
                        <td className="p-4 text-neutral-400">{new Date(device.last_seen_at).toLocaleString()}</td>
                        <td className="p-4 text-right">
                           <button className="p-2 text-neutral-500 hover:text-white transition-colors rounded-lg hover:bg-white/10" onClick={(e) => { e.stopPropagation(); /* handle actions menu */ }}>
                              <MoreHorizontal size={18} />
                           </button>
                        </td>
                     </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
