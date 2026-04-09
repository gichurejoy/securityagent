"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ShieldAlert, AlertTriangle, AlertCircle, Search, Filter } from "lucide-react";

export default function FindingsPage() {
  const [findings, setFindings] = useState<any[]>([]);
  const [deviceMap, setDeviceMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("http://127.0.0.1:8000/api/v1/dashboard/findings", { headers: { "Authorization": "Bearer dev-token" } }).then(r => r.ok ? r.json() : []),
      fetch("http://127.0.0.1:8000/api/v1/dashboard/devices", { headers: { "Authorization": "Bearer dev-token" } }).then(r => r.ok ? r.json() : [])
    ]).then(([fRes, dRes]) => {
      const dMap: Record<number, string> = {};
      if (Array.isArray(dRes)) {
         dRes.forEach(d => dMap[d.id] = d.hostname);
      }
      setDeviceMap(dMap);
      setFindings(Array.isArray(fRes) ? fRes : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const patchFinding = async (findingId: number, patch: any) => {
     // Optimistic update
     setFindings(prev => prev.map(f => f.id === findingId ? { ...f, ...patch } : f));
     try {
       await fetch(`http://127.0.0.1:8000/api/v1/dashboard/findings/${findingId}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json", "Authorization": "Bearer dev-token" },
         body: JSON.stringify(patch)
       });
     } catch (err) {
       console.error("Failed to patch finding");
     }
  };

  const findingsData = useMemo(() => {
    return findings.map(f => ({
      ...f,
      severity: f.check_key.includes('defender') || f.check_key.includes('bitlocker') ? 'Critical' : 'Medium'
    }));
  }, [findings]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Findings</h1>
            <p className="text-neutral-400">Track and remediate security violations.</p>
         </div>
         <div className="flex gap-2">
            <button className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-medium border border-white/10 transition-colors">
               Export CSV
            </button>
         </div>
      </div>

      <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
         <div className="p-4 border-b border-white/5 flex gap-4">
            <div className="flex-1 flex items-center bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 focus-within:ring-2 ring-indigo-500/50 transition-all">
               <Search size={16} className="text-neutral-500" />
               <input type="text" placeholder="Search findings by device or rule..." className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white placeholder-neutral-500" />
            </div>
            <button className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-white/10 px-4 py-2 rounded-lg text-sm text-neutral-300 font-medium transition-colors">
               <Filter size={16} />
               <span>Status: All</span>
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-white/5 bg-neutral-950/50 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                     <th className="p-4">Severity</th>
                     <th className="p-4">Finding / Rule</th>
                     <th className="p-4">Device</th>
                     <th className="p-4">Discovered</th>
                     <th className="p-4">Status</th>
                     <th className="p-4">Assignee</th>
                  </tr>
               </thead>
               <tbody className="text-sm">
                  {loading ? (
                     <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Loading findings...</td></tr>
                  ) : findingsData.length === 0 ? (
                     <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No security findings active.</td></tr>
                  ) : findingsData.map((finding: any) => (
                     <tr 
                        key={finding.id} 
                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                     >
                        <td className="p-4">
                           <div className="flex items-center gap-2">
                              {finding.severity === "Critical" && <ShieldAlert size={16} className="text-rose-500" />}
                              {finding.severity === "Medium" && <AlertCircle size={16} className="text-amber-500" />}
                              <span className={`font-medium ${
                                 finding.severity === "Critical" ? 'text-rose-400' : 'text-amber-400'
                              }`}>{finding.severity}</span>
                           </div>
                        </td>
                        <td className="p-4 font-mono text-neutral-300">{finding.check_key}</td>
                        <td className="p-4">
                           <Link href={`/devices/${finding.device_id}`} className="font-medium text-indigo-300 hover:text-indigo-400 hover:underline">
                              {deviceMap[finding.device_id] || `Device #${finding.device_id}`}
                           </Link>
                        </td>
                        <td className="p-4 text-neutral-400">{new Date(finding.first_seen_at).toLocaleDateString()}</td>
                        <td className="p-4">
                           <select 
                              value={finding.status} 
                              onChange={(e) => patchFinding(finding.id, { status: e.target.value })}
                              className={`bg-neutral-900 border appearance-none px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide outline-none focus:ring-2 ring-indigo-500/50 cursor-pointer ${
                                 finding.status === "open" ? 'border-rose-500/50 text-rose-300' : 
                                 finding.status === "in_progress" ? 'border-indigo-500/50 text-indigo-300' : 
                                 finding.status === "resolved" ? 'border-emerald-500/50 text-emerald-300' :
                                 'border-neutral-500/50 text-neutral-400'
                              }`}
                           >
                              <option value="open">OPEN</option>
                              <option value="in_progress">IN PROGRESS</option>
                              <option value="resolved">RESOLVED</option>
                              <option value="accepted_risk">ACCEPTED RISK</option>
                              <option value="false_positive">FALSE POSITIVE</option>
                           </select>
                        </td>
                                                 <td className="p-4">
                            <select 
                               value={finding.assignee || "IT"} 
                               onChange={(e) => patchFinding(finding.id, { assignee: e.target.value })}
                               className={`bg-neutral-900 border appearance-none px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide outline-none focus:ring-2 ring-indigo-500/50 cursor-pointer transition-all ${
                                  finding.assignee === "EMPLOYEE" ? 'border-pink-500/50 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'border-neutral-700 text-neutral-400'
                               }`}
                            >
                               <option value="IT">IT TEAM</option>
                               <option value="EMPLOYEE">EMPLOYEE</option>
                            </select>
                         </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
