"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, LayoutDashboard, MonitorSmartphone, Activity, SearchCheck, BellRing, FileText, Settings, ShieldHalf } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { name: "Overview", icon: LayoutDashboard, path: "/admin" },
  { name: "Devices", icon: MonitorSmartphone, path: "/devices" },
  { name: "Checks Analysis", icon: SearchCheck, path: "/analysis" },
  { name: "Trends", icon: Activity, path: "/trends" },
  { name: "Findings", icon: ShieldAlert, path: "/findings" },
  { name: "Alerts", icon: BellRing, path: "/alerts" },
  { name: "Reports", icon: FileText, path: "/reports" },
  { name: "Employee Portal", icon: ShieldHalf, path: "/portal" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-white/5 bg-neutral-950/60 backdrop-blur-xl h-screen flex flex-col p-4 z-50 transition-all">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <ShieldHalf className="text-indigo-400" size={24} />
        </div>
        <div>
           <h1 className="font-bold text-lg tracking-tight text-white">MedServ</h1>
           <p className="text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">Diagnostic Agent</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link key={item.name} href={item.path}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden ${
                  isActive
                    ? "text-white bg-white/5 border border-white/10"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <div 
                    className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-lg" 
                  />
                )}
                <item.icon size={18} className={`relative z-10 transition-colors ${isActive ? "text-indigo-400" : "group-hover:text-indigo-300"}`} />
                <span className="relative z-10">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5 font-medium">
           <Settings size={18} />
           <span>Settings</span>
        </div>
      </div>
    </div>
  );
}
