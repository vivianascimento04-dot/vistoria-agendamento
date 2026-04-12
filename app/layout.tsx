'use client'
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{margin:0, padding:0, background:'#f4f6fb'}}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}