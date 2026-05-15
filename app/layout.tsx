import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Site Factory',
  description: 'Private site builder',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
