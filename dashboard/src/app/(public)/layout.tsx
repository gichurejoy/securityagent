export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col relative min-h-screen overflow-x-hidden">
        {/* Distinct public landing page ambient effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/4 w-[40rem] h-[40rem] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <main className="flex-1 z-0">
          {children}
        </main>
    </div>
  );
}
