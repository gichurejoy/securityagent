"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Activity, ListChecks, Mail, ChevronRight, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { API_BASE_URL } from "@/lib/api";

export default function EmployeePortal() {
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const statsRes = await fetch(`${API_BASE_URL}/v1/portal/stats/${email}`);
      if (!statsRes.ok) throw new Error("Could not find a device linked to this email.");
      const statsData = await statsRes.json();
      
      const historyRes = await fetch(`${API_BASE_URL}/v1/portal/history/${email}`);
      const historyData = await historyRes.json();

      setStats(statsData);
      setHistory(historyData.history || []);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl">
         <div className="flex flex-col items-center text-center space-y-6">
            <div className="bg-indigo-600/10 p-4 rounded-2xl border border-indigo-500/20">
               <Shield className="text-indigo-400" size={32} />
            </div>
            <div>
               <h1 className="text-2xl font-bold text-white">Employee Security Portal</h1>
               <p className="text-neutral-400 text-sm mt-2">Enter your work email to view your device health.</p>
            </div>
            
            <form onSubmit={handleLogin} className="w-full space-y-4">
               <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.smith@company.com"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
               </div>
               
               {error && <p className="text-rose-400 text-xs font-medium text-left">{error}</p>}

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
               >
                  {loading ? "Identifying device..." : "View My Report"}
                  <ChevronRight size={18} />
               </button>
            </form>
         </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-5xl mx-auto pb-12">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-1">Employee Security Portal</h2>
             <h1 className="text-3xl font-bold text-white">My Security Posture</h1>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="text-xs text-neutral-500 hover:text-white transition-colors">
             Switch Account ({email})
          </button>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
             <div className="flex justify-between items-center mb-4">
                <p className="text-neutral-400 text-sm font-medium">Security Score</p>
                <Shield size={20} className={stats.risk_score > 80 ? "text-emerald-400" : "text-amber-400"} />
             </div>
             <div className="text-5xl font-black text-white">{stats.risk_score}</div>
             <p className="text-xs text-neutral-500 mt-4 flex items-center gap-1">
                Last checked: {new Date(stats.last_scan).toLocaleString()}
             </p>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-pink-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
             <div className="flex justify-between items-center mb-4">
                <p className="text-neutral-400 text-sm font-medium">Device Status</p>
                <CheckCircle2 size={20} className="text-indigo-400" />
             </div>
             <div className="text-3xl font-bold text-white">{stats.status_summary}</div>
             <p className="text-xs text-neutral-500 mt-4 uppercase tracking-tighter">{stats.hostname}</p>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-pink-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
             <div className="flex justify-between items-center mb-4">
                <p className="text-neutral-400 text-sm font-medium">Open Actions</p>
                <AlertTriangle size={20} className={stats.active_findings > 0 ? "text-rose-400" : "text-emerald-400"} />
             </div>
             <div className="text-4xl font-bold text-white">{stats.active_findings}</div>
             <p className="text-xs text-neutral-500 mt-4 italic">Issues IT requires you to resolve</p>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-pink-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>
       </div>

       {/* Score History */}
       <div className="grid grid-cols-1 gap-6">
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-xl">
             <div className="flex items-center gap-3 mb-8">
                <TrendingUp size={20} className="text-indigo-400" />
                <h3 className="font-bold text-xl text-white">Security Score Trend (30 Days)</h3>
             </div>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#525252" domain={[0, 100]} tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>

       {/* Action Items Sections */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Employee Actions */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2 px-2">
                <AlertTriangle size={18} className="text-pink-400" />
                <h3 className="font-bold text-lg text-white">Items requiring your attention</h3>
             </div>
             <div className="space-y-3">
                {stats.findings.filter((f: any) => f.assignee === 'EMPLOYEE' && f.status !== 'resolved').length === 0 ? (
                   <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 text-center">
                      <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                      <p className="text-emerald-400 font-medium text-sm">No actions required from you!</p>
                   </div>
                ) : stats.findings.filter((f: any) => f.assignee === 'EMPLOYEE' && f.status !== 'resolved').map((f: any) => (
                   <div key={f.id} className="bg-neutral-900 border border-pink-500/10 hover:border-pink-500/30 rounded-2xl p-5 transition-all shadow-lg group">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-pink-300 font-bold text-sm mb-1 uppercase tracking-wider">{f.check_key.replace(/_/g, ' ')}</p>
                            <p className="text-neutral-400 text-sm leading-relaxed">This setting on your computer is below the security threshold. Please resolve it to improve your score.</p>
                         </div>
                         <div className="bg-pink-500/10 text-pink-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter shadow-[0_0_10px_rgba(236,72,153,0.1)]">Action Required</div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px]">
                         <span className="text-neutral-500 italic">Will be verified on next system scan</span>
                         <span className="text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded uppercase font-bold">{f.status.replace(/_/g, ' ')}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* IT Actions */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2 px-2">
                <Activity size={18} className="text-indigo-400" />
                <h3 className="font-bold text-lg text-white">Handled by IT Team</h3>
             </div>
             <div className="space-y-3">
                {stats.findings.filter((f: any) => f.assignee === 'IT' && f.status !== 'resolved').length === 0 ? (
                   <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6 text-center">
                      <p className="text-neutral-500 text-sm italic">No system-level issues pending.</p>
                   </div>
                ) : stats.findings.filter((f: any) => f.assignee === 'IT' && f.status !== 'resolved').map((f: any) => (
                   <div key={f.id} className="bg-neutral-900/50 border border-white/5 hover:border-indigo-500/20 rounded-2xl p-5 transition-all group opacity-80 hover:opacity-100">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-indigo-300 font-bold text-sm mb-1 uppercase tracking-wider">{f.check_key.replace(/_/g, ' ')}</p>
                            <p className="text-neutral-500 text-sm leading-relaxed italic">IT is working remotely or via patch to resolve this for you.</p>
                         </div>
                         <div className="bg-neutral-800 text-neutral-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">IT Assigned</div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>


       {/* Footer */}
       <div className="text-center p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
          <p className="text-neutral-400 text-sm">Need help resolving a security issue? Contact IT at <a href="it@medservafrica.com" className="text-indigo-400 font-bold hover:underline">it@medservafrica.com</a></p>
       </div>
    </motion.div>
  );
}
