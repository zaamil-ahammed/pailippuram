import './globals.css';
import Link from 'next/link';
import Shell from '../components/Shell';
import InstallPrompt from '../components/InstallPrompt';
import ShareToast from '../components/ShareToast';

export const metadata = {
  title: 'Nammude Pailippuram',
  description: 'Local community information directory for Pailippuram, Kerala: contacts, local shops, bus timings, blood donors, panchayath details, announcements, and submissions.',
  openGraph: {
    title: 'Nammude Pailippuram',
    description: 'Local community information directory for Pailippuram, Kerala: contacts, local shops, bus timings, blood donors, panchayath details, announcements, and submissions.',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pailippuram',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e40af',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@400;600;800&family=Baloo+Chettan+2:wght@600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Shell>
          <InstallPrompt />
          <ShareToast />
          {children}
          <footer className="footer" style={{ maxWidth: 640, margin: '0 auto' }}>
            <span>
             
               <Link href="/about">About and privacy</Link>
            </span>
            <span style={{ textAlign: 'center' }}>
              A{' '}
              <Link href="https://www.instagram.com/victory_pailippuram" target="_blank" rel="noopener noreferrer">
                <strong>Victory</strong>
              </Link>{' '}
              Initiative · Crafted by{' '}
              <Link href="https://42rgb.linklee.in" target="_blank" rel="noopener noreferrer">
                <strong>@zaamil.ahmed</strong>
              </Link>
            </span>
          </footer>
        </Shell>
      </body>
    </html>
  );
}
