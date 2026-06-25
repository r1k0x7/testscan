import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { MobileNav } from '@/components/MobileNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'HypurrScan Clone',
  description: 'Real-time Hyperliquid blockchain explorer',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased bg-slate-950 text-slate-100`}>
        {/* Desktop Nav */}
        <nav className="hidden md:block border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <a href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">
                H
              </div>
              <span className="font-bold text-lg">HypurrScan</span>
            </a>
            <div className="flex items-center gap-1">
              <NavLink href="/" icon="⛓️" label="Explorer" />
              <NavLink href="/whales" icon="🐋" label="Whales" />
              <NavLink href="/vaults" icon="🏦" label="Vaults" />
              <NavLink href="/bundles" icon="📦" label="Bundles" />
            </div>
          </div>
        </nav>

        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8
