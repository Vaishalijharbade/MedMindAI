'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { motion } from 'framer-motion'
import { QrCode, Download, Printer, AlertTriangle, Plus, X, Loader2, Save, Heart, Phone, User, Droplets } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import { BLOOD_GROUPS } from '@/lib/utils'

interface Contact { name: string; phone: string; relation: string }

function TagInput({ label, field, inputKey, placeholder, color, form, inputs, setInputs, addTag, removeTag }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-slate-400 font-medium">{label}</label>
        <span className="text-[11px] text-slate-500">Press Enter or click + to add</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(form[field as keyof typeof form] as string[]).map((tag: string, i: number) => (
          <span key={i} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
            {tag}
            <button onClick={() => removeTag(field, i)} className="hover:opacity-75 transition-opacity"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          value={(inputs as any)[inputKey]} 
          onChange={(e) => setInputs((i: any) => ({ ...i, [inputKey]: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(field, inputKey) } }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }} 
        />
        <button 
          onClick={() => addTag(field, inputKey)}
          type="button"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-cyan-400 hover:text-white hover:bg-cyan-500 flex items-center justify-center transition-all"
          style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)' }}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

export default function EmergencyPage() {
  const { user } = useUser()
  const [dbUserId, setDbUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const [form, setForm] = useState({
    bloodGroup: 'O+',
    allergies: [] as string[],
    chronicDiseases: [] as string[],
    currentMeds: [] as string[],
    emergencyContacts: [] as Contact[],
    doctorName: '', doctorPhone: '', notes: '',
  })

  const [inputs, setInputs] = useState({ allergy: '', disease: '', med: '' })
  const [newContact, setNewContact] = useState<Contact>({ name: '', phone: '', relation: '' })
  const [showContact, setShowContact] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!user) return
      try {
        // Sync user & get DB id
        const userRes = await axios.post('/api/user', {
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName, lastName: user.lastName, imageUrl: user.imageUrl,
        })
        const uid = userRes.data.user.id
        setDbUserId(uid)

        // Fetch emergency profile
        const res = await axios.get('/api/emergency')
        if (res.data.profile) {
          const p = res.data.profile
          setForm({
            bloodGroup: p.bloodGroup || 'O+',
            allergies: p.allergies || [],
            chronicDiseases: p.chronicDiseases || [],
            currentMeds: p.currentMeds || [],
            emergencyContacts: p.emergencyContacts || [],
            doctorName: p.doctorName || '',
            doctorPhone: p.doctorPhone || '',
            notes: p.notes || '',
          })
          // Generate QR
          generateQR(uid)
        }
      } catch { } finally { setLoading(false) }
    }
    init()
  }, [user])

  const generateQR = async (uid: string) => {
    try {
      const url = `${window.location.origin}/emergency/${uid}`
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300, margin: 2,
        color: { dark: '#0ea5e9', light: '#060b14' },
      })
      setQrUrl(dataUrl)
    } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Auto-commit any typed text that hasn't been added with + or Enter yet
      const currentForm = { ...form }
      if (inputs.allergy.trim()) {
        currentForm.allergies = [...currentForm.allergies, inputs.allergy.trim()]
      }
      if (inputs.disease.trim()) {
        currentForm.chronicDiseases = [...currentForm.chronicDiseases, inputs.disease.trim()]
      }
      if (inputs.med.trim()) {
        currentForm.currentMeds = [...currentForm.currentMeds, inputs.med.trim()]
      }

      setForm(currentForm)
      setInputs({ allergy: '', disease: '', med: '' })

      const res = await axios.post('/api/emergency', currentForm)
      const uid = dbUserId || res.data.profile.userId
      if (uid) generateQR(uid)
      toast.success('Emergency profile saved! QR code updated.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally { setSaving(false) }
  }

  const addTag = (field: 'allergies' | 'chronicDiseases' | 'currentMeds', key: string) => {
    const val = inputs[key as keyof typeof inputs].trim()
    if (!val) return
    setForm((f) => ({ ...f, [field]: [...f[field], val] }))
    setInputs((i) => ({ ...i, [key]: '' }))
  }

  const removeTag = (field: 'allergies' | 'chronicDiseases' | 'currentMeds', idx: number) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }))
  }

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return toast.error('Name and phone required')
    setForm((f) => ({ ...f, emergencyContacts: [...f.emergencyContacts, newContact] }))
    setNewContact({ name: '', phone: '', relation: '' })
    setShowContact(false)
  }

  // Removed inline TagInput component to fix React unmount/focus-loss bug

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-96 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Emergency QR Health Card</h1>
        <p className="text-slate-400 text-sm mt-1">Fill your emergency info and generate a QR code for first responders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          {/* Blood Group */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Droplets size={15} className="text-rose-400" /> Basic Info
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Blood Group *</label>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button key={bg} onClick={() => setForm((f) => ({ ...f, bloodGroup: bg }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        form.bloodGroup === bg
                          ? 'text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      style={form.bloodGroup === bg
                        ? { background: 'linear-gradient(135deg, #ef4444, #f43f5e)', boxShadow: '0 0 12px rgba(239,68,68,0.4)' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Medical Info */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" /> Medical Information
            </h2>
            <TagInput label="Allergies" field="allergies" inputKey="allergy" placeholder="e.g. Penicillin, Peanuts"
              color="bg-rose-500/20 text-rose-300 border border-rose-500/30"
              form={form} inputs={inputs} setInputs={setInputs} addTag={addTag} removeTag={removeTag} />
            <TagInput label="Chronic Diseases" field="chronicDiseases" inputKey="disease" placeholder="e.g. Diabetes Type 2"
              color="bg-amber-500/20 text-amber-300 border border-amber-500/30"
              form={form} inputs={inputs} setInputs={setInputs} addTag={addTag} removeTag={removeTag} />
            <TagInput label="Current Medications" field="currentMeds" inputKey="med" placeholder="e.g. Metformin 500mg"
              color="bg-blue-500/20 text-blue-300 border border-blue-500/30"
              form={form} inputs={inputs} setInputs={setInputs} addTag={addTag} removeTag={removeTag} />
          </div>

          {/* Emergency Contacts */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Phone size={15} className="text-emerald-400" /> Emergency Contacts
              </h2>
              <button onClick={() => setShowContact(!showContact)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            {showContact && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                {[
                  { key: 'name', placeholder: 'Name' },
                  { key: 'phone', placeholder: 'Phone' },
                  { key: 'relation', placeholder: 'Relation' },
                ].map((f) => (
                  <input key={f.key} value={(newContact as any)[f.key]}
                    onChange={(e) => setNewContact((c) => ({ ...c, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="px-3 py-2 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
                <button onClick={addContact} className="sm:col-span-3 py-2 rounded-xl text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }}>
                  Add Contact
                </button>
              </div>
            )}
            {form.emergencyContacts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">No contacts added yet</p>
            ) : (
              <div className="space-y-2">
                {form.emergencyContacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <User size={13} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.phone} · {c.relation}</p>
                    </div>
                    <button onClick={() => setForm((f) => ({ ...f, emergencyContacts: f.emergencyContacts.filter((_, j) => j !== i) }))}
                      className="text-slate-500 hover:text-rose-400"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Doctor & Notes */}
          <div className="glass-card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Heart size={15} className="text-pink-400" /> Doctor & Notes
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Doctor Name</label>
                <input value={form.doctorName} onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
                  placeholder="Dr. Name"
                  className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Doctor Phone</label>
                <input value={form.doctorPhone} onChange={(e) => setForm((f) => ({ ...f, doctorPhone: e.target.value }))}
                  placeholder="+91..."
                  className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Additional Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any important notes for emergency responders..."
                rows={3} className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)' }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save & Generate QR Code'}
          </motion.button>
        </div>

        {/* QR Code Preview */}
        <div className="space-y-4">
          <div className="glass-card p-6 text-center sticky top-6">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center justify-center gap-2">
              <QrCode size={15} className="text-cyan-400" /> Emergency QR Card
            </h2>
            {qrUrl ? (
              <>
                <div className="inline-block p-4 rounded-2xl mb-4" style={{ background: '#060b14', border: '2px solid rgba(14,165,233,0.3)' }}>
                  <img src={qrUrl} alt="Emergency QR Code" className="w-48 h-48" />
                </div>
                <p className="text-xs text-slate-400 mb-2">Scan to view emergency info</p>
                <p className="text-xs text-emerald-400 mb-4">✓ QR code ready for use</p>

                {/* Mini Preview Card */}
                <div className="glass p-4 rounded-2xl text-left mb-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="px-3 py-1.5 rounded-lg font-bold text-lg text-white"
                         style={{ background: 'linear-gradient(135deg, #ef4444, #f43f5e)' }}>
                      {form.bloodGroup}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user?.fullName || 'Patient'}</p>
                      <p className="text-xs text-slate-400">Emergency Medical Info</p>
                    </div>
                  </div>
                  {form.allergies.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-rose-400 font-medium">⚠️ Allergies</p>
                      <p className="text-xs text-slate-300">{form.allergies.join(', ')}</p>
                    </div>
                  )}
                  {form.chronicDiseases.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-amber-400 font-medium">🏥 Conditions</p>
                      <p className="text-xs text-slate-300">{form.chronicDiseases.join(', ')}</p>
                    </div>
                  )}
                  {form.emergencyContacts.length > 0 && (
                    <div>
                      <p className="text-xs text-emerald-400 font-medium">📞 Emergency Contact</p>
                      <p className="text-xs text-slate-300">{form.emergencyContacts[0].name}: {form.emergencyContacts[0].phone}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <a href={qrUrl} download="medmind-emergency-qr.png"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                    style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }}>
                    <Download size={14} /> Download QR
                  </a>
                  <button onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Printer size={14} /> Print
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <QrCode size={32} className="text-slate-600" />
                </div>
                <p className="text-sm text-slate-400 mb-2">No QR code yet</p>
                <p className="text-xs text-slate-500">Fill your emergency info and save to generate your QR code</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
