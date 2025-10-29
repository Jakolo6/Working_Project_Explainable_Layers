// Root layout component for Next.js app

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'XAI Financial Services',
  description: 'Explainable AI in Credit Risk Assessment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
