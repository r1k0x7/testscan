import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'HypurrScan Clone',
  description: 'Real-time Hyperliquid blockchain explorer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased bg-slate-950 text-slate-100`}>
        <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">
                H
              </div>
              <span className="font-bold text-lg hidden sm:block">HypurrScan</span>
            </a>
            <div className="flex items-center gap-4 text-sm">
              <a href="/" className="text-slate-400 hover:text-slate-200 transition-colors">Explorer</a>
              <a href="/whales" className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1">
                <span>🐋</span> Whales
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
