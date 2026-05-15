import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { InstallPrompt } from '@/components/install-prompt' // Importação do novo componente
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

// Metadata atualizado com suporte a PWA e iOS
export const metadata: Metadata = {
  title: 'BankPix - Banco Digital',
  description: 'Sua plataforma financeira digital completa',
  generator: 'v0.app',
  manifest: '/manifest.json', // Link para o arquivo que remove o símbolo do Chrome
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png', // Ícone para dispositivos Apple
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BankPix',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Melhora a experiência de "App" evitando zoom acidental
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '829061486173119');
              // PageView automático removido para controle manual no funil
            `
          }}
        />
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=829061486173119&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <InstallPrompt /> {/* O modal de instalação fica ativo em todo o site */}
        <Analytics />
      </body>
    </html>
  )
}
