import './globals.css';
import Link from 'next/link';
import Shell from '../components/Shell';
import InstallPrompt from '../components/InstallPrompt';
import Toast from '../components/Toast';

export const metadata = {
  title: 'Nammude Pailippuram',
  description: 'Local community information directory for Pailippuram, Kerala: contacts, local shops, bus timings, blood donors, panchayath details, announcements, and submissions.',
  openGraph: {
    title: 'Nammude Pailippuram',
    description: 'Local community information directory for Pailippuram, Kerala: contacts, local shops, bus timings, blood donors, panchayath details, announcements, and submissions.',
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Shell>
          <InstallPrompt />
          <Toast />
          {children}
          <footer className="footer" style={{ maxWidth: 640, margin: '0 auto' }}>
            <span>
              <Link href="/correction">Request a correction</Link> · <Link href="/about">About and privacy</Link>
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
