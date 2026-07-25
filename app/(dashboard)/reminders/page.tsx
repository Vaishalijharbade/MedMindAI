'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Plus, X, Trash2, Check, Clock, Pill, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, DAYS_OF_WEEK } from '@/lib/utils'

const TIMES = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

export default function RemindersPage() {
  const [medicines, setMedicines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', dosage: '', frequency: '', purpose: '',
    startDate: new Date().toISOString().split('T')[0], endDate: '',
    reminderTimes: ['08:00'], reminderDays: [...DAYS_OF_WEEK],
  })

  const fetchMedicines = async () => {
    try {
      const res = await axios.get('/api/reminders')
      setMedicines(res.data.medicines || [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchMedicines() }, [])

  const toggleTime = (t: string) => {
    setForm((f) => ({
      ...f,
      reminderTimes: f.reminderTimes.includes(t)
        ? f.reminderTimes.filter((x) => x !== t)
        : [...f.reminderTimes, t],
    }))
  }

  const toggleDay = (d: string) => {
    setForm((f) => ({
      ...f,
      reminderDays: f.reminderDays.includes(d)
        ? f.reminderDays.filter((x) => x !== d)
        : [...f.reminderDays, d],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.dosage || !form.frequency) return toast.error('Fill all required fields')
    setSaving(true)
    try {
      await axios.post('/api/reminders', form)
      toast.success('Medicine added!')
      setShowForm(false)
      setForm({ name: '', dosage: '', frequency: '', purpose: '', startDate: new Date().toISOString().split('T')[0], endDate: '', reminderTimes: ['08:00'], reminderDays: [...DAYS_OF_WEEK] })
      fetchMedicines()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add medicine')
    } finally { setSaving(false) }
  }

  const deleteMedicine = async (id: string) => {
    try {
      await axios.delete(`/api/reminders?id=${id}`)
      setMedicines((prev) => prev.filter((m) => m.id !== id))
      toast.success('Medicine removed')
    } catch { toast.error('Failed to delete') }
  }

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await axios.patch('/api/reminders', { medicineId: id, isActive: !current })
      setMedicines((prev) => prev.map((m) => m.id === id ? { ...m, isActive: !current } : m))
      toast.success(current ? 'Medicine paused' : 'Medicine activated')
    } catch { toast.error('Update failed') }
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="skeleton h-8 w-48 rounded-lg" />
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  const active = medicines.filter((m) => m.isActive)
  const inactive = medicines.filter((m) => !m.isActive)

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Medicine Reminders</h1>
          <p className="text-slate-400 text-sm mt-1">{active.length} active · {inactive.length} paused</p>
        </div>
        <motion.button onClick={() => setShowForm(!showForm)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)' }}>
          <Plus size={16} /> Add Medicine
        </motion.button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Pill size={15} className="text-cyan-400" /> Add New Medicine
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'name', label: 'Medicine Name *', placeholder: 'e.g. Metformin' },
                  { key: 'dosage', label: 'Dosage *', placeholder: 'e.g. 500mg' },
                  { key: 'frequency', label: 'Frequency *', placeholder: 'e.g. Twice daily after meals' },
                  { key: 'purpose', label: 'Purpose', placeholder: 'e.g. Blood sugar control' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-xs text-slate-400 mb-1.5 block">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                ))}

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-cyan-500"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">End Date (optional)</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-cyan-500"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
                </div>
              </div>

              {/* Reminder Times */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Reminder Times</label>
                <div className="flex flex-wrap gap-2">
                  {TIMES.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTime(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.reminderTimes.includes(t)
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      style={!form.reminderTimes.includes(t) ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Days</label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map((d) => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.reminderDays.includes(d)
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'text-slate-500 hover:text-white'
                      }`}
                      style={!form.reminderDays.includes(d) ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } : {}}>
                      {d[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)' }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {saving ? 'Saving...' : 'Add Medicine'}
                </motion.button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medicines List */}
      {medicines.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Pill size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400 mb-2">No medicines added yet</p>
          <button onClick={() => setShowForm(true)} className="text-sm text-cyan-400 hover:text-cyan-300">Add your first medicine →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...active, ...inactive].map((med: any) => (
            <motion.div key={med.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`glass-card overflow-hidden transition-all ${!med.isActive ? 'opacity-60' : ''}`}>
              <div className="p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  med.isActive ? 'bg-emerald-500/20' : 'bg-slate-700'
                }`}>
                  <Pill size={18} className={med.isActive ? 'text-emerald-400' : 'text-slate-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{med.name}</h3>
                    {!med.isActive && <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">Paused</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{med.dosage} · {med.frequency}</p>
                  {med.purpose && <p className="text-xs text-slate-500 mt-0.5">For: {med.purpose}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={11} className="text-slate-600" />
                    <p className="text-xs text-slate-500">
                      {med.reminders?.slice(0, 3).map((r: any) => r.time).join(', ') || 'No reminders set'}
                      {med.reminders?.length > 3 ? ` +${med.reminders.length - 3}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(med.id, med.isActive)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      med.isActive ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'
                    }`}>
                    {med.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => deleteMedicine(med.id)} className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
