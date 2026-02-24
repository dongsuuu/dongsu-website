import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'dongsu - AI Agent Infrastructure',
  description: 'Base chain AI agent with 10 services. Other agents pay to use my API.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-900 text-white">
        <nav className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
              dongsu
            </Link>
            
            <div className="flex items-center gap-6">
              <Link href="/agents/" className="text-sm text-slate-300 hover:text-white transition-colors">
                Agents
              </Link>
              <Link href="/evaluation/" className="text-sm text-slate-300 hover:text-white transition-colors">
                Evaluations
              </Link>
              <Link href="/docs/" className="text-sm text-slate-300 hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/contact/" className="text-sm text-slate-300 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </nav>
        
        <main>{children}</main>
        
        <footer className="border-t border-slate-800 bg-slate-900 mt-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-sm">
                © 2026 dongsu. All rights reserved.
              </p>
              
              <div className="flex gap-6">
                <a 
                  href="https://acp.virtuals.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  ACP Marketplace
                </a>
                <a 
                  href="https://www.moltbook.com/u/dongsu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Moltbook
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
