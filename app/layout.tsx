import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'MedMind AI – Your Intelligent Digital Health Companion',
  description: 'AI-powered healthcare platform that securely stores your medical history, analyzes reports, provides personalized health insights, and generates emergency QR health cards.',
  keywords: 'medical records, AI health, medical report analysis, emergency QR card, health dashboard',
  openGraph: {
    title: 'MedMind AI',
    description: 'Your Intelligent Digital Health Companion',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className="font-sans antialiased" suppressHydrationWarning>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
