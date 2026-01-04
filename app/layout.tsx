import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quick Transfer - P2P File Transfer',
  description: 'Transfer files directly between devices via WiFi using WebRTC',
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
