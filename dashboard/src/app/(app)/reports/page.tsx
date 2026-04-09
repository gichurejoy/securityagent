"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileDown, CheckCircle } from "lucide-react";

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/dashboard/reports/generate", {
         method: "POST",
         headers: { "Authorization": "Bearer dev-token" }
      });
      const data = await res.json();
      
      if (data.downloadUrl) {
         // Create a fake anchor to fire the download
         const a = document.createElement('a');
         a.href = data.downloadUrl;
         a.download = `Security_Executive_Report_${new Date().toISOString().split('T')[0]}.json`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         setSuccess(true);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto">
      <div>
         <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Security Reports</h1>
         <p className="text-neutral-400">Generate compliance and audit reports for executives.</p>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-xl max-w-2xl text-center flex flex-col items-center">
         <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
            <FileDown className="text-indigo-400" size={28} />
         </div>
         
         <h2 className="text-xl font-bold text-white mb-2">Executive Overview Report</h2>
         <p className="text-neutral-400 mb-8 max-w-md">
            Download a compiled snapshot containing the fleet-wide compliance rate, all active devices, and current unresolved security findings required for external audit compliance.
         </p>

         <button 
           onClick={handleGenerate}
           disabled={generating}
           className="bg-indigo-600 hover:bg-indigo-500 focus:scale-95 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium transition-all w-full md:w-auto"
         >
           {generating ? "Compiling Snapshot..." : "Generate & Download (JSON)"}
         </button>
         
         {success && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-medium">
               <CheckCircle size={16} /> Report generated successfully.
            </motion.div>
         )}
      </div>
    </motion.div>
  );
}
