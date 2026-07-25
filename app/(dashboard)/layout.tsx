'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Upload,
  FileText,
  MessageSquare,
  Bell,
  QrCode,
  Activity,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-cyan-400' },
  { href: '/upload', icon: Upload, label: 'Upload Report', color: 'text-blue-400' },
  { href: '/reports', icon: FileText, label: 'Medical Timeline', color: 'text-purple-400' },
  { href: '/chat', icon: MessageSquare, label: 'AI Assistant', color: 'text-emerald-400' },
  { href: '/reminders', icon: Bell, label: 'Reminders', color: 'text-amber-400' },
  { href: '/emergency', icon: QrCode, label: 'Emergency QR', color: 'text-rose-400' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #060b14 0%, #0a1020 100%)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
        'w-64 flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )} style={{ background: 'rgba(10,16,32,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)' }}>
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base gradient-text">MedMind AI</h1>
            <p className="text-xs text-slate-500">Health Companion</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer',
                    isActive 
                      ? 'bg-white/8 border border-white/10' 
                      : 'hover:bg-white/4 border border-transparent'
                  )}
                >
                  <item.icon size={18} className={cn(isActive ? item.color : 'text-slate-400 group-hover:text-slate-200')} />
                  <span className={cn('text-sm font-medium', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-cyan)' }} />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <UserButton appearance={{
              elements: { avatarBox: 'w-8 h-8' }
            }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 font-medium truncate">My Account</p>
              <p className="text-xs text-slate-500">Patient Profile</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header (mobile) */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 border-b sticky top-0 z-30"
                style={{ background: 'rgba(10,16,32,0.9)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)' }}>
              <Activity size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm gradient-text">MedMind AI</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
