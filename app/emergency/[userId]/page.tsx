import { notFound } from 'next/navigation'
import { Activity, AlertTriangle, Pill, Phone, Heart, Droplets } from 'lucide-react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Emergency Medical Information – MedMind AI',
  description: 'Emergency medical information card',
  robots: 'noindex, nofollow',
}

type EmergencyContact = {
  name: string
  phone: string
  relation: string
}

export default async function PublicEmergencyPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      emergencyProfile: true,
    },
  })

  if (!user || !user.emergencyProfile) {
    notFound()
  }

  const name =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Patient'

  const profile = user.emergencyProfile

  const contacts: EmergencyContact[] = Array.isArray(profile.emergencyContacts)
    ? (profile.emergencyContacts as EmergencyContact[])
    : []

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #060b14, #0a1020)' }}
    >
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
            }}
          >
            <Activity size={24} className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white">🚑 EMERGENCY</h1>
          <p className="text-slate-400 text-sm">
            Medical Information Card
          </p>
        </div>

        {/* Patient */}
        <div
          className="glass-card p-5 mb-4 text-center"
          style={{ borderColor: 'rgba(239,68,68,0.3)' }}
        >
          <p className="text-lg font-bold text-white">{name}</p>

          <div
            className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
              boxShadow: '0 0 20px rgba(239,68,68,0.4)',
            }}
          >
            <Droplets size={18} className="text-white" />
            <span className="text-2xl font-black text-white">
              {profile.bloodGroup}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-2">Blood Group</p>
        </div>

        {/* Allergies */}
        {profile.allergies?.length > 0 && (
          <div
            className="glass-card p-4 mb-4"
            style={{ borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle size={13} />
              ⚠️ ALLERGIES
            </h2>

            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((a: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-sm font-medium text-rose-200 bg-rose-500/20 border border-rose-500/30"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chronic Diseases */}
        {profile.chronicDiseases?.length > 0 && (
          <div className="glass-card p-4 mb-4">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              🏥 Medical Conditions
            </h2>

            <div className="flex flex-wrap gap-2">
              {profile.chronicDiseases.map((d: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-sm text-amber-200 bg-amber-500/20 border border-amber-500/30"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Current Medications */}
        {profile.currentMeds?.length > 0 && (
          <div className="glass-card p-4 mb-4">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Pill size={12} />
              Current Medications
            </h2>

            <ul className="space-y-1">
              {profile.currentMeds.map((m: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-slate-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Emergency Contacts */}
        {contacts.length > 0 && (
          <div
            className="glass-card p-4 mb-4"
            style={{ borderColor: 'rgba(16,185,129,0.2)' }}
          >
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Phone size={12} />
              Emergency Contacts
            </h2>

            <div className="space-y-3">
              {contacts.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {c.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {c.relation}
                    </p>
                  </div>

                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white"
                    style={{
                      background:
                        'linear-gradient(135deg, #10b981, #0ea5e9)',
                    }}
                  >
                    <Phone size={12} />
                    {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctor */}
        {(profile.doctorName || profile.doctorPhone) && (
          <div className="glass-card p-4 mb-4">
            <h2 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Heart size={12} />
              Treating Doctor
            </h2>

            <div className="flex items-center justify-between">
              <p className="text-sm text-white">
                {profile.doctorName}
              </p>

              {profile.doctorPhone && (
                <a
                  href={`tel:${profile.doctorPhone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white"
                  style={{
                    background: 'rgba(236,72,153,0.2)',
                    border: '1px solid rgba(236,72,153,0.3)',
                  }}
                >
                  <Phone size={12} />
                  {profile.doctorPhone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {profile.notes && (
          <div className="glass-card p-4 mb-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Additional Notes
            </h2>

            <p className="text-sm text-slate-300">
              {profile.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity size={14} className="text-cyan-400" />
            <span className="text-xs font-semibold gradient-text">
              MedMind AI
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Secure Medical ID · Generated by MedMind AI
          </p>
        </div>
      </div>
    </div>
  )
}