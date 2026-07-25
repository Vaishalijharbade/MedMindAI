'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import {
  FileText, Upload, MessageSquare, Bell, TrendingUp, AlertTriangle,
  CheckCircle, Activity, Heart, Droplets, Zap, ChevronRight, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, timeAgo, RECORD_TYPE_LABELS, RECORD_TYPE_COLORS, METRIC_LABELS } from '@/lib/utils'

const StatCard = ({ icon: Icon, label, value, sub, color, href }: any) => (
  <Link href={href}>
    <motion.div whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }}
      className="glass-card p-5 cursor-pointer group transition-all duration-300 hover:border-white/15"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-white mt-3">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  </Link>
)

const MetricChart = ({ title, data, color, unit }: any) => (
  <div className="glass-card p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <span className="text-xs text-slate-500">{unit}</span>
    </div>
    {data && data.length > 0 ? (
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
            tickFormatter={(d) => d.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={35} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#f1f5f9' }} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            fill={`url(#gradient-${color})`} dot={{ fill: color, strokeWidth: 0, r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    ) : (
      <div className="h-28 flex items-center justify-center">
        <p className="text-xs text-slate-600">No data yet. Upload a report to see trends.</p>
      </div>
    )}
  </div>
)

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [records, setRecords] = useState<any[]>([])
  const [medicines, setMedicines] = useState<any[]>([])
  const [metrics, setMetrics] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) return

    const syncUser = async () => {
      await axios.post('/api/user', {
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      }).catch(() => {})
    }

    const fetchData = async () => {
      await syncUser()
      const [recordsRes, medsRes, metricsRes] = await Promise.allSettled([
        axios.get('/api/reports?limit=5'),
        axios.get('/api/reminders'),
        axios.get('/api/metrics'),
      ])
      if (recordsRes.status === 'fulfilled') setRecords(recordsRes.value.data.records || [])
      if (medsRes.status === 'fulfilled') setMedicines(medsRes.value.data.medicines || [])
      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data.metrics || {})
      setLoading(false)
    }

    fetchData()
  }, [isLoaded, user])

  const analyzedCount = records.filter(r => r.isAnalyzed).length
  const activeMeds = medicines.filter((m: any) => m.isActive).length
  const abnormalCount = records.reduce((sum: number, r: any) => sum + (r.abnormalFindings?.length || 0), 0)

  const chartData = [
    { key: 'BLOOD_SUGAR', title: 'Blood Sugar', color: '#f43f5e', unit: 'mg/dL' },
    { key: 'HEMOGLOBIN', title: 'Hemoglobin', color: '#10b981', unit: 'g/dL' },
    { key: 'CHOLESTEROL_TOTAL', title: 'Cholesterol', color: '#f59e0b', unit: 'mg/dL' },
    { key: 'BLOOD_PRESSURE_SYSTOLIC', title: 'Blood Pressure', color: '#3b82f6', unit: 'mmHg' },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            <span className="gradient-text">{user?.firstName || 'Patient'} 👋</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's your health overview for today</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm text-slate-400">
          <Calendar size={14} />
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={FileText} label="Total Reports" value={records.length} sub={`${analyzedCount} analyzed`}
          color="bg-gradient-to-br from-blue-500 to-blue-600" href="/reports" />
        <StatCard icon={Activity} label="Active Medicines" value={activeMeds}
          sub={`${medicines.length} total`} color="bg-gradient-to-br from-emerald-500 to-emerald-600" href="/reminders" />
        <StatCard icon={AlertTriangle} label="Abnormal Findings" value={abnormalCount}
          sub="across all reports" color="bg-gradient-to-br from-rose-500 to-rose-600" href="/reports" />
        <StatCard icon={Upload} label="Upload Report" value="+ New" sub="Analyze with AI"
          color="bg-gradient-to-br from-purple-500 to-purple-600" href="/upload" />
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-cyan-400" /> Health Trends
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {chartData.map((c) => (
            <MetricChart key={c.key} title={c.title} data={metrics[c.key]} color={c.color} unit={c.unit} />
          ))}
        </div>
      </div>

      {/* Recent Reports & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Reports */}
        <div className="lg:col-span-3 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText size={15} className="text-blue-400" /> Recent Reports
            </h2>
            <Link href="/reports" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {records.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <FileText size={20} className="text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">No reports yet</p>
              <Link href="/upload">
                <button className="mt-3 text-xs text-cyan-400 hover:text-cyan-300">Upload your first report →</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record: any) => (
                <motion.div key={record.id} whileHover={{ x: 2 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{record.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-md border ${RECORD_TYPE_COLORS[record.type]}`}>
                        {RECORD_TYPE_LABELS[record.type]}
                      </span>
                      <span className="text-xs text-slate-500">{timeAgo(record.reportDate)}</span>
                    </div>
                    {record.aiSummary && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{record.aiSummary}</p>
                    )}
                  </div>
                  {record.isAnalyzed ? (
                    <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 flex-shrink-0 mt-0.5" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + Medicines */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Actions */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Zap size={15} className="text-amber-400" /> Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { href: '/upload', label: 'Upload New Report', icon: Upload, color: 'text-blue-400' },
                { href: '/chat', label: 'Ask AI Assistant', icon: MessageSquare, color: 'text-emerald-400' },
                { href: '/reminders', label: 'Add Medicine', icon: Bell, color: 'text-amber-400' },
                { href: '/emergency', label: 'Update QR Card', icon: Activity, color: 'text-rose-400' },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <action.icon size={15} className={action.color} />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
                    <ChevronRight size={13} className="ml-auto text-slate-600 group-hover:text-slate-400" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Active Medicines */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Heart size={15} className="text-rose-400" /> Active Medicines
            </h2>
            {medicines.filter((m: any) => m.isActive).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No active medicines</p>
            ) : (
              <div className="space-y-2">
                {medicines.filter((m: any) => m.isActive).slice(0, 4).map((med: any) => (
                  <div key={med.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.dosage} · {med.frequency}</p>
                    </div>
                  </div>
                ))}
                {medicines.filter((m: any) => m.isActive).length > 4 && (
                  <Link href="/reminders">
                    <p className="text-xs text-cyan-400 text-center mt-2">+{medicines.filter((m: any) => m.isActive).length - 4} more →</p>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
