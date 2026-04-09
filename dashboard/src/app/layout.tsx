import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedServ Diagnostic Agent | Security Platform",
  description: "Enterprise endpoint security posture tracking and personal audit portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased selection:bg-indigo-500/30 min-h-screen flex`}>
        {children}
      </body>
    </html>
  );
}
