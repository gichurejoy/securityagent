"use client";
import React from "react";
import { Search, ShieldAlert, ScanLine } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-16 px-6 border-b border-white/5 bg-neutral-950/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      
      <div className="flex items-center bg-neutral-900 border border-white/10 rounded-full px-4 py-1.5 w-96 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all hidden md:flex">
         <Search size={16} className="text-neutral-500" />
         <input 
           type="text" 
           placeholder="Search devices, employees, hostname..." 
           className="bg-transparent border-none outline-none text-sm ml-2 w-full text-neutral-200 placeholder-neutral-500 font-medium focus:ring-0" 
         />
      </div>

      <div className="flex items-center gap-6 ml-auto">
         {/* Org Score Badge */}
         <div className="flex flex-col items-end">
            <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Org Score</span>
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">92</span>
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">+4%</span>
            </div>
         </div>

         <div className="h-8 w-px bg-white/10" />

         <button className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg border border-white/10 text-sm font-medium transition-all group shadow-sm">
            <ScanLine size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Scan All</span>
         </button>

         <button className="relative p-2 text-neutral-400 hover:text-white transition-colors">
            <ShieldAlert size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
         </button>

         <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-neutral-900 shadow-md flex items-center justify-center cursor-pointer hover:shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-shadow">
            <span className="text-xs font-bold text-white shadow-sm">IT</span>
         </div>
      </div>
    </header>
  );
}
