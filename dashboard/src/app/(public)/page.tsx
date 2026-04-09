"use client";
import React from "react";
import { motion } from "framer-motion";
import { Shield, Download, CheckCircle2, Apple, Monitor, Globe, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center space-y-8"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
           <Shield size={14} /> Security Compliance Platform
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
          Keep your work <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">computer secure.</span>
        </h1>
        
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          The MedServ Diagnostic Agent monitors your workstation's security posture to keep you and our patients' data safe. 
          <span className="block mt-2">Takes less than 2 minutes to set up.</span>
        </p>

        {/* Download Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-3xl mx-auto">
           {/* Windows Primary */}
           <motion.div 
             whileHover={{ scale: 1.02 }}
             className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center group"
           >
              <div className="bg-indigo-600/10 p-4 rounded-2xl border border-indigo-500/20 mb-6 group-hover:bg-indigo-600/20 transition-all">
                 <Monitor className="text-indigo-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Windows</h3>
              <p className="text-neutral-500 text-sm mb-8">v1.0.0 • Supports Win 10 & 11</p>
              
              <a 
                href="http://localhost:8000/api/v1/agent/download" 
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/20"
              >
                 <Download size={20} /> Download Agent (.exe)
              </a>
           </motion.div>

           {/* Coming Soon - macOS/Linux */}
           <div className="bg-neutral-900/20 backdrop-blur-sm border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center text-center opacity-60">
              <div className="flex gap-4 mb-6">
                 <Apple className="text-neutral-500" size={24} />
                 <Globe className="text-neutral-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-neutral-400 mb-2">macOS & Linux</h3>
              <p className="text-neutral-500 text-sm mb-6">Built-in scripts coming soon.</p>
              <div className="mt-auto px-4 py-2 bg-neutral-800/40 rounded-lg text-xs font-medium text-neutral-500 border border-white/5">
                 Contact IT for manual audits
              </div>
           </div>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 pt-10 border-t border-white/5">
           {[
             { title: "Daily Checks", desc: "Background security audit once a day.", icon: CheckCircle2 },
             { title: "Privacy First", desc: "Only scans security settings, not files.", icon: Shield },
             { title: "Live Score", desc: "View your personal security dashboard.", icon: Monitor },
             { title: "IT Sync", desc: "Automated report for easy compliance.", icon: ChevronRight },
           ].map((item, idx) => (
             <div key={idx} className="flex flex-col items-start text-left space-y-2">
                <item.icon size={20} className="text-indigo-400" />
                <h4 className="font-bold text-white">{item.title}</h4>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>

        {/* Footer actions */}
        <div className="mt-20 pt-10 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm">
           <Link href="/portal" className="text-neutral-400 hover:text-white flex items-center gap-2 group underline-offset-4 hover:underline">
              Already installed? <span className="font-bold text-white">Go to my portal</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
           </Link>
           <span className="text-neutral-800 hidden sm:inline">|</span>
           <span className="text-neutral-500 italic">Questions? Contact IT at <a href="mailto:it@medservafrica.com" className="text-indigo-400 hover:underline">it@medservafrica.com</a></span>
        </div>
      </motion.div>
    </div>
  );
}
