"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, ShieldAlert, Zap, History } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function AlertsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/v1/dashboard/alerts/rules`, { headers: { "Authorization": "Bearer dev-token" } }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/v1/dashboard/alerts/history`, { headers: { "Authorization": "Bearer dev-token" } }).then(r => r.ok ? r.json() : [])
    ]).then(([rData, hData]) => {
      setRules(Array.isArray(rData) ? rData : []);
      setHistory(Array.isArray(hData) ? hData : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
         <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Alerts & Notifications</h1>
         <p className="text-neutral-400">Manage security tripwires and notification channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules Table */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl overflow-hidden">
           <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                 <Zap className="text-indigo-400" size={20} /> Active Alert Rules
              </h3>
              <button disabled className="text-xs bg-indigo-600/50 text-indigo-200 px-3 py-1.5 rounded disabled:opacity-50 cursor-not-allowed">
                 + New Rule
              </button>
           </div>
           
           <div className="p-0">
              {loading ? (
                 <div className="p-8 text-neutral-500 text-center">Loading rules...</div>
              ) : rules.length === 0 ? (
                 <div className="p-8 text-neutral-500 text-center">No alert rules configured.</div>
              ) : (
                 <table className="w-full text-left text-sm">
                    <thead>
                       <tr className="bg-neutral-950/50 border-b border-white/5 text-neutral-500 font-semibold">
                          <th className="p-4">Name</th>
                          <th className="p-4">Condition</th>
                          <th className="p-4">Channel</th>
                       </tr>
                    </thead>
                    <tbody>
                       {rules.map(rule => (
                          <tr key={rule.id} className="border-b border-white/5 hover:bg-white/5">
                             <td className="p-4 font-medium text-neutral-200">
                                <div className="flex items-center gap-2">
                                   {rule.severity === 'critical' ? <ShieldAlert size={14} className="text-rose-400" /> : <Bell size={14} className="text-amber-400" />}
                                   {rule.name}
                                </div>
                             </td>
                             <td className="p-4 font-mono text-xs text-indigo-300">{rule.trigger_check ? `[${rule.trigger_check}] ` : ''}{rule.trigger_condition}</td>
                             <td className="p-4 text-neutral-400 uppercase text-xs tracking-wider">{rule.notify_via}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              )}
           </div>
        </div>

        {/* Action History */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl overflow-hidden">
           <div className="p-6 border-b border-white/5">
              <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                 <History className="text-neutral-400" size={20} /> Fulfillment History
              </h3>
           </div>
           <div className="p-6">
              {loading ? (
                 <div className="text-neutral-500 text-center">Loading history...</div>
              ) : history.length === 0 ? (
                 <div className="text-neutral-500 text-center">No alerts have fired yet. The fleet is secure!</div>
              ) : (
                 <div className="space-y-4">
                    {history.map(item => (
                       <div key={item.id} className="flex gap-4 p-4 bg-neutral-950 border border-white/5 rounded-xl">
                          <Bell className="text-amber-400 shrink-0 mt-1" size={16} />
                          <div>
                             <div className="text-sm font-medium text-neutral-200 mb-1">{item.message}</div>
                             <div className="text-xs text-neutral-500">Sent via {item.channel} • {new Date(item.fired_at).toLocaleDateString()}</div>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
