export default function manifest() {
  return {
    id: '/',
    name: 'Nammude Pailippuram (നമ്മുടെ പൈലിപ്പുറം)',
    short_name: 'Pailippuram',
    description: 'Local information for Pailippuram: contacts, shops, bus timing, blood donors and announcements.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#102c86',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
