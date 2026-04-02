import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import Header from '@/components/Header'
import { ThemeProvider } from '@/contexts/ThemeContext'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Knowala — Pergunta do Dia',
    template: '%s | Knowala',
  },
  description: 'Participe da discussão diária. Uma pergunta, infinitas perspectivas.',
  keywords: ['knowala', 'pergunta do dia', 'discussão', 'comunidade', 'Brasil'],
  authors: [{ name: 'Knowala' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXTAUTH_URL,
    siteName: 'Knowala',
    title: 'Knowala — Pergunta do Dia',
    description: 'Participe da discussão diária. Uma pergunta, infinitas perspectivas.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';if(t==='light'){document.documentElement.classList.add('light')}else if(t==='auto'&&!window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <SessionProvider>
            <Header />
            <main className="max-w-5xl mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="border-t border-[var(--border)] mt-16 py-8">
              <div className="max-w-5xl mx-auto px-4 text-center text-xs text-[var(--text-secondary)] tracking-wide">
                <p>© {new Date().getFullYear()} Knowala · Feito com ❤️ no Brasil</p>
                <p className="mt-1.5">Horário de Brasília (UTC-3) · Nova pergunta todo dia às 08:00</p>
              </div>
            </footer>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
