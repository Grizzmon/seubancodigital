import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { InstallPrompt } from "@/components/install-prompt";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import ServiceWorkerRegister from "@/components/service-worker-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Bankpix_2.0 Pro",
  description: "Descrição",
  manifest: "/manifest.json",
  icons: {
    icon: "/app-icon.png",
    apple: "/launchericon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BankPix",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#3b82f6",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="BankPix" />
        <meta name="application-name" content="BankPix" />
        <meta name="msapplication-TileColor" content="#0f172a" />

        <link
          rel="apple-touch-icon"
          href="/launchericon-192x192.png"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;
              n.push=n;
              n.loaded=!0;
              n.version='2.0';
              n.queue=[];
              t=b.createElement(e);
              t.async=!0;
              t.src=v;
              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s);
              }(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','829061486173119');
              fbq('track','PageView');
            `,
          }}
        />

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=829061486173119&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>

      <body className={`${inter.variable} font-sans antialiased`}>
        <ServiceWorkerRegister />
        {children}
        <InstallPrompt />
        <PwaInstallPrompt />
        <Analytics />
      </body>
    </html>
  );
}
