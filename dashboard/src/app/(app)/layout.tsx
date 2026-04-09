"use client";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Subtle ambient light effects for the wow factor */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />
        
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 z-0 scrollbar-hide">
          {children}
        </main>
      </div>
    </>
  );
}
