import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), 'MMM dd, yyyy hh:mm a')
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const RECORD_TYPE_LABELS: Record<string, string> = {
  PRESCRIPTION: 'Prescription',
  BLOOD_REPORT: 'Blood Report',
  XRAY: 'X-Ray',
  MRI: 'MRI Scan',
  ECG: 'ECG',
  OTHER: 'Other',
}

export const RECORD_TYPE_COLORS: Record<string, string> = {
  PRESCRIPTION: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  BLOOD_REPORT: 'bg-red-500/20 text-red-300 border-red-500/30',
  XRAY: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  MRI: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  ECG: 'bg-green-500/20 text-green-300 border-green-500/30',
  OTHER: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export const METRIC_LABELS: Record<string, { label: string; unit: string; normal?: string }> = {
  BLOOD_SUGAR: { label: 'Blood Sugar', unit: 'mg/dL', normal: '70-99' },
  HEMOGLOBIN: { label: 'Hemoglobin', unit: 'g/dL', normal: '13.5-17.5' },
  CHOLESTEROL_TOTAL: { label: 'Total Cholesterol', unit: 'mg/dL', normal: '<200' },
  CHOLESTEROL_HDL: { label: 'HDL Cholesterol', unit: 'mg/dL', normal: '>40' },
  CHOLESTEROL_LDL: { label: 'LDL Cholesterol', unit: 'mg/dL', normal: '<100' },
  BLOOD_PRESSURE_SYSTOLIC: { label: 'BP Systolic', unit: 'mmHg', normal: '<120' },
  BLOOD_PRESSURE_DIASTOLIC: { label: 'BP Diastolic', unit: 'mmHg', normal: '<80' },
  HEART_RATE: { label: 'Heart Rate', unit: 'bpm', normal: '60-100' },
  BMI: { label: 'BMI', unit: 'kg/m²', normal: '18.5-24.9' },
  WEIGHT: { label: 'Weight', unit: 'kg', normal: '' },
  CREATININE: { label: 'Creatinine', unit: 'mg/dL', normal: '0.7-1.2' },
  URIC_ACID: { label: 'Uric Acid', unit: 'mg/dL', normal: '3.5-7.2' },
  VITAMIN_D: { label: 'Vitamin D', unit: 'ng/mL', normal: '30-100' },
  VITAMIN_B12: { label: 'Vitamin B12', unit: 'pg/mL', normal: '200-900' },
  THYROID_TSH: { label: 'Thyroid TSH', unit: 'mIU/L', normal: '0.4-4.0' },
  OTHER: { label: 'Other', unit: '', normal: '' },
}

export const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
