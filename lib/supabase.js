import { createClient } from '@supabase/supabase-js';

export function normalizeSupabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Handle Supabase project ID (e.g. "jwmcvrkwxcacfwcdkjqr")
  if (/^[a-z0-9]{20}$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }

  // Prepend https:// if protocol is omitted (e.g. "jwmcvrkwxcacfwcdkjqr.supabase.co")
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
  } catch {
    // invalid URL format
  }

  return '';
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const url = normalizeSupabaseUrl(rawUrl);
const key = rawKey && rawKey !== 'placeholder' ? rawKey : '';

export const isRealSupabaseConfigured = Boolean(url && key);
// For the UI, we consider the app configured either via real Supabase or our resilient in-memory data store.
export const isConfigured = true;

// Removes characters that have a special meaning inside a search filter.
export function cleanSearch(text) {
  return (text || '').replace(/[%,()*\\]/g, ' ').trim().slice(0, 60);
}

// Phone helpers shared by every page that shows a number.
export function digits(phone) {
  return (phone || '').replace(/\D/g, '');
}

export function whatsappLink(phone) {
  const d = digits(phone);
  if (!d) return '';
  return `https://wa.me/${d.length === 10 ? '91' + d : d}`;
}

export function formatDate(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(value || '');
  }
}

// -------------------------------------------------------------
// Seed Data for In-Memory Database Fallback
// -------------------------------------------------------------

const INITIAL_CATEGORIES = [
  // Important Contacts
  { id: 1, kind: 'contact', name: 'Government Hospital / PHC', name_ml: 'സർക്കാർ ആശുപത്രി / പി.എച്ച്.സി' },
  { id: 2, kind: 'contact', name: 'Police Station', name_ml: 'പോലീസ് സ്റ്റേഷൻ' },
  { id: 3, kind: 'contact', name: 'Fire & Rescue Services', name_ml: 'ഫയർ & റെസ്ക്യൂ സർവീസ്' },
  { id: 4, kind: 'contact', name: 'Electricity Complaints (KSEB)', name_ml: 'കെ.എസ്.ഇ.ബി ഇലക്ട്രിസിറ്റി പരാതികൾ' },
  { id: 5, kind: 'contact', name: 'Akshaya Centre', name_ml: 'അക്ഷയ കേന്ദ്രം' },
  { id: 6, kind: 'contact', name: 'Post Office', name_ml: 'പോസ്റ്റ് ഓഫീസ്' },

  // Local Shops (Where people buy products or visit a business)
  { id: 10, kind: 'business', name: 'Supermarkets', name_ml: 'സൂപ്പർമാർക്കറ്റുകൾ' },
  { id: 11, kind: 'business', name: 'Bakeries', name_ml: 'ബേക്കറികൾ' },
  { id: 12, kind: 'business', name: 'Pharmacies', name_ml: 'ഫാർമസികൾ / മരുന്നുകടകൾ' },
  { id: 13, kind: 'business', name: 'Hardware Shops', name_ml: 'ഹാർഡ്‌വെയർ കടകൾ' },
  { id: 14, kind: 'business', name: 'Tyre Shops', name_ml: 'ടയർ ഷോപ്പുകൾ' },
  { id: 15, kind: 'business', name: 'Textile & Clothing Shops', name_ml: 'ടെക്സ്റ്റൈൽസ് & വസ്ത്രക്കടകൾ' },

  // Native Workers (People whom residents hire to perform a service)
  { id: 20, kind: 'worker', name: 'Electricians', name_ml: 'ഇലക്ട്രീഷ്യന്മാർ' },
  { id: 21, kind: 'worker', name: 'Plumbers', name_ml: 'പ്ലംബർമാർ' },
  { id: 22, kind: 'worker', name: 'Puncture Repair Workers', name_ml: 'പഞ്ചർ ഒട്ടിക്കുന്ന തൊഴിലാളികൾ' },
  { id: 23, kind: 'worker', name: 'Carpenters', name_ml: 'ആശാരിമാർ (തച്ചന്മാർ)' },
  { id: 24, kind: 'worker', name: 'Painters', name_ml: 'പെയിന്റർമാർ' },
  { id: 25, kind: 'worker', name: 'Coconut Climbers', name_ml: 'തെങ്ങ് കയറ്റം / മരം മുറിക്കൽ' },

  // Transportation Services (People and businesses providing transport)
  { id: 30, kind: 'transport', name: 'Auto-Rickshaw Drivers', name_ml: 'ഓട്ടോറിക്ഷ ഡ്രൈവർമാർ' },
  { id: 31, kind: 'transport', name: 'Taxi & Cab Services', name_ml: 'ടാക്സി & കാർ സർവീസുകൾ' },
  { id: 32, kind: 'transport', name: 'Goods Auto Services', name_ml: 'ഗുഡ്സ് ഓട്ടോ സർവീസ്' },
  { id: 33, kind: 'transport', name: 'Excavator / JCB Operators', name_ml: 'ജെ.സി.ബി & എർത്ത്മൂവർ' },
];

const INITIAL_LISTINGS = [
  // 1. Important contacts
  {
    id: 'l-contact-1',
    kind: 'contact',
    title: 'Pailippuram Primary Health Centre (PHC)',
    category_id: 1,
    description: 'Government Primary Health Centre. OP timing: 9:00 AM - 1:00 PM. First aid, doctor consultation, and vaccination.',
    phone: '04662223400',
    whatsapp: '04662223400',
    area: 'Hospital Junction, Pailippuram',
    hours: '9:00 AM - 4:00 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'l-contact-2',
    kind: 'contact',
    title: 'Police Station (Thrithala / Pailippuram)',
    category_id: 2,
    description: 'Local police station and law enforcement helpline. Emergency dial: 112 / 100.',
    phone: '04662271240',
    whatsapp: '',
    area: 'Main Road, Pailippuram',
    hours: '24 Hours',
    status: 'approved',
    verified_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'l-contact-3',
    kind: 'contact',
    title: 'Fire & Rescue Services Station',
    category_id: 3,
    description: '24/7 fire fighting, emergency rescue and accident response. Emergency: 101.',
    phone: '04662212101',
    whatsapp: '',
    area: 'Pattambi - Pailippuram',
    hours: '24 Hours',
    status: 'approved',
    verified_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'l-contact-4',
    kind: 'contact',
    title: 'KSEB Section Office (Electricity Complaints)',
    category_id: 4,
    description: '24/7 power breakdown and line complaints helpline for Pailippuram electrical section.',
    phone: '9496010101',
    whatsapp: '9496010101',
    area: 'Near Post Office',
    hours: '24 Hours',
    status: 'approved',
    verified_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'l-contact-5',
    kind: 'contact',
    title: 'Akshaya Centre Pailippuram',
    category_id: 5,
    description: 'Aadhaar services, government certificate applications, bill payments, ration card renewals.',
    phone: '9847112233',
    whatsapp: '9847112233',
    area: 'Bus Stand Complex',
    hours: '9:30 AM - 6:00 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },

  // 2. Local shops (Where people buy products or visit a business)
  {
    id: 'l-shop-1',
    kind: 'business',
    title: 'Green Valley Supermarket',
    category_id: 10,
    description: 'Fresh vegetables, fruits, groceries, dairy, stationery and daily essentials. Home delivery available.',
    phone: '9847123456',
    whatsapp: '9847123456',
    area: 'Pailippuram Town',
    hours: '7:30 AM - 9:30 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'l-shop-2',
    kind: 'business',
    title: 'Malabar Bakes & Coolbar',
    category_id: 11,
    description: 'Fresh bakery snacks, cakes, halwa, fresh juice, and cool drinks.',
    phone: '9847123457',
    whatsapp: '9847123457',
    area: 'Bus Stand Road',
    hours: '8:00 AM - 10:00 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'l-shop-3',
    kind: 'business',
    title: 'City Medicals & Pharmacy',
    category_id: 12,
    description: 'Prescription medicines, baby care items, health supplements and first aid items. 24 hour emergency counter.',
    phone: '9847123458',
    whatsapp: '9847123458',
    area: 'Opposite PHC',
    hours: '24 Hours',
    status: 'approved',
    verified_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'l-shop-4',
    kind: 'business',
    title: 'National Hardware & Electricals',
    category_id: 13,
    description: 'Paints, sanitary items, plumbing pipes, PVC fittings, switches, wires and building supplies.',
    phone: '9847123459',
    whatsapp: '9847123459',
    area: 'Market Junction',
    hours: '8:00 AM - 8:30 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'l-shop-5',
    kind: 'business',
    title: 'Goodwill Tyre House & Care',
    category_id: 14,
    description: 'New two-wheeler and four-wheeler tyres, tubes, alloy wheels, and nitrogen air filling.',
    phone: '9847123460',
    whatsapp: '9847123460',
    area: 'Pailippuram Bypass',
    hours: '8:30 AM - 8:30 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },

  // 3. Native workers (People whom residents hire to perform a service)
  {
    id: 'l-worker-1',
    kind: 'worker',
    title: 'Suresh Kumar (Electrician)',
    category_id: 20,
    photo_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23e0e7ff"/><circle cx="60" cy="46" r="26" fill="%23c7d2fe"/><circle cx="60" cy="46" r="22" fill="%23fcd34d"/><path d="M42 40c0-10 8-16 18-16s18 6 18 16c0 2-4 3-4 3s-4-1-14-1-14 1-14 1-4-1-4-3z" fill="%231e293b"/><circle cx="52" cy="46" r="2.5" fill="%231e293b"/><circle cx="68" cy="46" r="2.5" fill="%231e293b"/><path d="M56 55q4 3 8 0" stroke="%23b45309" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M50 51q10 3 20 0" stroke="%231e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M26 104c0-18 15-28 34-28s34 10 34 28z" fill="%232563eb"/><path d="M46 76l14 16 14-16" fill="%23ffffff"/></svg>',
    description: 'Domestic house wiring, single/3-phase works, motor pump connections and inverter fitting.',
    phone: '9847234567',
    whatsapp: '9847234567',
    area: 'Ward 3, Pailippuram',
    hours: '8:00 AM - 7:00 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'l-worker-2',
    kind: 'worker',
    title: 'Musthafa P (Plumber)',
    category_id: 21,
    description: 'Water tank cleaning, pipeline leak repairs, bathroom fittings and sanitary maintenance.',
    phone: '9847234568',
    whatsapp: '9847234568',
    area: 'Vadakkumuri',
    hours: '7:30 AM - 6:30 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'l-worker-3',
    kind: 'worker',
    title: 'Ashraf (Mobile Puncture Repair)',
    category_id: 22,
    description: 'On-road tubeless tyre puncture fixing, two-wheeler and four-wheeler mobile puncture repair across Pailippuram.',
    phone: '9847234571',
    whatsapp: '9847234571',
    area: 'Pailippuram & Nearby Wards',
    hours: '7:00 AM - 9:00 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'l-worker-4',
    kind: 'worker',
    title: 'Raveendran (Coconut Climber / Harvester)',
    category_id: 25,
    description: 'Coconut harvesting, palm crown cleaning, tree trimming and seasonal maintenance.',
    phone: '9847234570',
    whatsapp: '',
    area: 'Kizhumuri',
    hours: 'Morning 6:30 AM onwards',
    status: 'approved',
    verified_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 11 * 86400000).toISOString(),
  },

  // 4. Transportation services (People and businesses providing transport)
  {
    id: 'l-transport-1',
    kind: 'transport',
    title: 'Pailippuram Junction Auto Stand (Sasi & Team)',
    category_id: 30,
    photo_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23fef3c7"/><path d="M25 80h70a8 8 0 0 0 8-8V46a10 10 0 0 0-10-10H50L30 46H16v26a8 8 0 0 0 8 8z" fill="%23eab308"/><path d="M30 46l16-10h24v18H25z" fill="%230f172a"/><rect x="74" y="42" width="22" height="12" rx="2" fill="%23f8fafc"/><rect x="18" y="70" width="84" height="6" fill="%230f172a"/><circle cx="38" cy="84" r="12" fill="%231e293b"/><circle cx="38" cy="84" r="5" fill="%23cbd5e1"/><circle cx="82" cy="84" r="12" fill="%231e293b"/><circle cx="82" cy="84" r="5" fill="%23cbd5e1"/></svg>',
    description: 'Auto Rickshaw service for local trips, school runs, and emergency hospital visits. 24 hours available on call.',
    phone: '9847345678',
    whatsapp: '9847345678',
    area: 'Pailippuram Junction Stand',
    hours: '24 Hours on call',
    status: 'approved',
    verified_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'l-transport-2',
    kind: 'transport',
    title: 'Aliyar Taxi & Tourist Cab (Innova / Swift)',
    category_id: 31,
    photo_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f5f3ff"/><path d="M18 78l8-24a10 10 0 0 1 9.5-6.8h49a10 10 0 0 1 9.5 6.8l8 24z" fill="%236366f1"/><rect x="48" y="38" width="24" height="9" rx="3" fill="%23facc15"/><text x="60" y="45" font-size="6" font-weight="900" text-anchor="middle" fill="%23000">TAXI</text><rect x="15" y="72" width="90" height="16" rx="4" fill="%234338ca"/><circle cx="36" cy="88" r="10" fill="%231e293b"/><circle cx="36" cy="88" r="4" fill="%23e2e8f0"/><circle cx="84" cy="88" r="10" fill="%231e293b"/><circle cx="84" cy="88" r="4" fill="%23e2e8f0"/><rect x="34" y="52" width="22" height="16" rx="2" fill="%23f8fafc"/><rect x="62" y="52" width="22" height="16" rx="2" fill="%23f8fafc"/></svg>',
    description: 'Airport drops (Calicut & Cochin), wedding trips, hospital emergency trips with AC 7-seater Innova & Swift.',
    phone: '9847345680',
    whatsapp: '9847345680',
    area: 'Taxi Stand, Pailippuram',
    hours: '24 Hours',
    status: 'approved',
    verified_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'l-transport-3',
    kind: 'transport',
    title: 'Hamsa Earthmovers & JCB 3DX',
    category_id: 33,
    description: 'JCB, mini-excavator and tipper service for plot leveling, foundation digging, drainage and soil transport.',
    phone: '9847345681',
    whatsapp: '9847345681',
    area: 'Pailippuram Stand',
    hours: '6:00 AM - 8:00 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'a-1',
    title: 'Grama Sabha Ward Meeting Scheduled',
    body: 'The 2nd ward Grama Sabha meeting will be held at the Community Hall this Saturday at 10:00 AM. Discussion on local road development, street lights and welfare schemes.',
    event_date: '2026-10-25',
    status: 'approved',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'a-2',
    title: 'Voluntary Blood Donation Camp at PHC',
    body: 'Victory Arts & Sports Club in association with Blood Bank Thalassery organizes a voluntary blood donation camp at Pailippuram PHC. All healthy eligible donors are welcome.',
    event_date: '2026-11-01',
    status: 'approved',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'a-3',
    title: 'Pre-Monsoon Public Canal Cleaning Drive',
    body: 'Haritha Karma Sena and ward volunteers are organizing a joint plastic waste collection and drainage clearance drive across all major junctions.',
    event_date: '2026-10-28',
    status: 'approved',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

const INITIAL_BUS_ROUTES = [
  {
    id: 'b-1',
    route: 'Pailippuram – Pattambi (via Thrithala)',
    direction: 'Towards Pattambi',
    bus_name: 'Victory & Rajadhani',
    times: '06:45 AM\n07:30 AM\n08:15 AM\n09:00 AM\n10:15 AM\n11:30 AM\n01:15 PM\n02:30 PM\n04:00 PM\n05:15 PM\n06:30 PM\n07:45 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'b-2',
    route: 'Pailippuram – Kuttipuram (via Chembra)',
    direction: 'Towards Kuttipuram',
    bus_name: 'Al-Ameen Motors',
    times: '07:00 AM\n08:00 AM\n09:30 AM\n11:00 AM\n01:00 PM\n03:15 PM\n04:45 PM\n06:15 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'b-3',
    route: 'Pailippuram – Valanchery (via Edappal)',
    direction: 'Towards Valanchery',
    bus_name: 'KSRTC Ordinary',
    times: '06:30 AM\n08:30 AM\n10:45 AM\n01:30 PM\n04:15 PM\n07:00 PM',
    status: 'approved',
    verified_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

const INITIAL_DONORS = [
  {
    id: 'd-1',
    name: 'Muhammed Shafi',
    blood_group: 'O+',
    photo_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23ffe4e6"/><circle cx="60" cy="46" r="26" fill="%23fecdd3"/><circle cx="60" cy="46" r="22" fill="%23fdba74"/><path d="M40 38c0-10 9-16 20-16s20 6 20 16c0 2-4 3-4 3s-4-1-16-1-16 1-16 1-4-1-4-3z" fill="%231e293b"/><circle cx="52" cy="46" r="2.5" fill="%231e293b"/><circle cx="68" cy="46" r="2.5" fill="%231e293b"/><path d="M56 55q4 2.5 8 0" stroke="%239a3412" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M26 104c0-18 15-28 34-28s34 10 34 28z" fill="%23e11d48"/><path d="M46 76l14 16 14-16" fill="%23ffffff"/></svg>',
    phone: '9847456781',
    area: 'Pailippuram West',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'd-2',
    name: 'Rahul Krishnan',
    blood_group: 'A+',
    phone: '9847456782',
    area: 'East Junction',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'd-3',
    name: 'Aneesh Kumar',
    blood_group: 'B+',
    phone: '9847456783',
    area: 'Vadakkumuri',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'd-4',
    name: 'Jithin V',
    blood_group: 'AB+',
    phone: '9847456784',
    area: 'Town Center',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'd-5',
    name: 'Haris P',
    blood_group: 'O-',
    phone: '9847456785',
    area: 'Hospital Road',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const INITIAL_PANCHAYATH = [
  {
    id: 'p-1',
    section: 'bearer',
    title: 'Grama Panchayath President',
    photo_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f1f5f9"/><circle cx="60" cy="46" r="26" fill="%23fed7aa"/><circle cx="60" cy="46" r="22" fill="%23fed7aa"/><path d="M38 42c0-12 10-18 22-18s22 6 22 18c0 3-4 4-4 4s-6-1-18-1-18 1-18 1-4-1-4-4z" fill="%23334155"/><circle cx="52" cy="45" r="2.5" fill="%230f172a"/><circle cx="68" cy="45" r="2.5" fill="%230f172a"/><path d="M55 54q5 3 10 0" stroke="%239a3412" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M48 50q12 3 24 0" stroke="%23334155" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 104c0-20 16-30 36-30s36 10 36 30z" fill="%230f172a"/><path d="M52 74l8 12 8-12" fill="%23ffffff"/><path d="M46 74l14 30 14-30" stroke="%23f59e0b" stroke-width="2" fill="none"/></svg>',
    extra: '04662223800',
    detail: 'Office room available for public grievances Monday to Friday, 10:30 AM to 1:30 PM.',
    status: 'approved',
    verified_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'p-2',
    section: 'bearer',
    title: 'Panchayath Secretary',
    extra: '04662223801',
    detail: 'Administrative office, birth/death records, permits and licenses.',
    status: 'approved',
    verified_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'p-3',
    section: 'ward',
    title: 'Ward 1 Member (Pailippuram North)',
    extra: '9847567890',
    detail: 'Ward 1 representative. Contact for local streetlight, drinking water or road maintenance.',
    status: 'approved',
    verified_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'p-4',
    section: 'service',
    title: 'Birth & Death Registration Services',
    extra: 'Panchayath Front Office',
    detail: 'Apply within 21 days for standard registration. Online applications also accepted via citizen portal.',
    status: 'approved',
    verified_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'p-5',
    section: 'notice',
    title: 'Haritha Karma Sena Monthly Collection',
    extra: '2026-10-30',
    detail: 'Non-biodegradable clean dry plastic collection fee: ₹50 per household. Hand over only segregated dry waste.',
    status: 'approved',
    verified_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const INITIAL_SUBMISSIONS = [
  {
    id: 's-1',
    type: 'business',
    title: 'New Pailippuram Fruits & Juice Corner',
    description: 'Category: Grocery / Supermarket · പലചരക്ക്\nHours: 8:00 AM - 9:00 PM\nHome Delivery: Available\nDetails: Fresh fruits, tender coconut, and fresh fruit juices.',
    phone: '9847011122',
    area: 'Near Post Office',
    submitter_contact: 'Ashraf (9847011122)',
    consent: true,
    status: 'pending',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 's-2',
    type: 'worker',
    title: 'Nazeer (Painter & Wall Art)',
    description: 'Trade / Skill: Painter · പെയിന്റർ\nWork details: Interior, exterior emulsion painting, putty & spray finish.',
    phone: '9847022233',
    area: 'Ward 2',
    submitter_contact: 'nazeer@example.com',
    consent: true,
    status: 'pending',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

// Global in-memory data store for mock mode
class InMemoryDatabase {
  constructor() {
    this.tables = {
      categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
      listings: JSON.parse(JSON.stringify(INITIAL_LISTINGS)),
      announcements: JSON.parse(JSON.stringify(INITIAL_ANNOUNCEMENTS)),
      bus_routes: JSON.parse(JSON.stringify(INITIAL_BUS_ROUTES)),
      donors: JSON.parse(JSON.stringify(INITIAL_DONORS)),
      panchayath_items: JSON.parse(JSON.stringify(INITIAL_PANCHAYATH)),
      submissions: JSON.parse(JSON.stringify(INITIAL_SUBMISSIONS)),
      audit_logs: [],
      admins: [{ user_id: 'demo-admin-uid' }],
    };
    this.currentUser = {
      id: 'demo-admin-uid',
      email: 'admin@pailippuram.local',
    };
    this.initFromLocalStorage();
  }

  initFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem('np_mock_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const [key, val] of Object.entries(parsed)) {
          if (Array.isArray(val) && val.length > 0) {
            this.tables[key] = val;
          }
        }
      }
      const savedUser = window.localStorage.getItem('np_mock_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch {
      // LocalStorage unavailable
    }
  }

  persist() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('np_mock_db', JSON.stringify(this.tables));
      if (this.currentUser) {
        window.localStorage.setItem('np_mock_user', JSON.stringify(this.currentUser));
      } else {
        window.localStorage.removeItem('np_mock_user');
      }
    } catch {
      // ignore
    }
  }

  getTable(name) {
    if (!this.tables[name]) {
      this.tables[name] = [];
    }
    return this.tables[name];
  }
}

const mockDb = new InMemoryDatabase();

class MockQueryBuilder {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
    this.filters = [];
    this.orFilters = [];
    this.orders = [];
    this.limitCount = null;
    this.rangeFrom = 0;
    this.rangeTo = null;
    this.selectCols = '*';
    this.isHead = false;
    this.isCountExact = false;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.insertData = null;
    this.updateData = null;
    this.isDelete = false;
  }

  select(cols = '*', options = {}) {
    this.selectCols = cols;
    if (options.head) this.isHead = true;
    if (options.count === 'exact') this.isCountExact = true;
    return this;
  }

  eq(col, val) {
    this.filters.push({ type: 'eq', col, val });
    return this;
  }

  neq(col, val) {
    this.filters.push({ type: 'neq', col, val });
    return this;
  }

  ilike(col, pattern) {
    this.filters.push({ type: 'ilike', col, pattern });
    return this;
  }

  not(col, op, val) {
    this.filters.push({ type: 'not', col, op, val });
    return this;
  }

  is(col, val) {
    this.filters.push({ type: 'is', col, val });
    return this;
  }

  or(filterStr) {
    if (filterStr) {
      this.orFilters.push(filterStr);
    }
    return this;
  }

  order(col, options = {}) {
    const ascending = options.ascending !== false;
    this.orders.push({ col, ascending });
    return this;
  }

  limit(n) {
    this.limitCount = n;
    return this;
  }

  range(from, to) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data) {
    this.insertData = data;
    return this;
  }

  update(data) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  _testOrCondition(row, cond) {
    // Examples: 'status.eq.approved', 'route.ilike.%t%', 'verified_at.is.null', 'verified_at.lt.2026-...'
    const parts = cond.split('.');
    if (parts.length < 3) return false;
    const col = parts[0];
    const op = parts[1];
    const val = parts.slice(2).join('.');
    const rowVal = row[col];

    if (op === 'eq') {
      return String(rowVal ?? '') === String(val);
    }
    if (op === 'neq') {
      return String(rowVal ?? '') !== String(val);
    }
    if (op === 'ilike') {
      const cleanPattern = val.replace(/%/g, '').toLowerCase();
      return String(rowVal ?? '').toLowerCase().includes(cleanPattern);
    }
    if (op === 'is' && val === 'null') {
      return rowVal == null;
    }
    if (op === 'lt') {
      return rowVal != null && rowVal < val;
    }
    if (op === 'gt') {
      return rowVal != null && rowVal > val;
    }
    return false;
  }

  async _execute() {
    const table = this.db.getTable(this.tableName);

    // 1. Handle INSERT
    if (this.insertData != null) {
      const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
      const inserted = [];
      for (const item of items) {
        const id = item.id || (this.tableName === 'categories' 
          ? (table.length > 0 ? Math.max(...table.map((t) => Number(t.id) || 0)) + 1 : 1)
          : `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
        const now = new Date().toISOString();
        const row = {
          ...item,
          id,
        };
        if (this.tableName !== 'categories') {
          row.created_at = item.created_at || now;
          row.updated_at = item.updated_at || now;
        }
        table.unshift(row);
        inserted.push(row);
      }
      this.db.persist();
      if (this.isSingle || !Array.isArray(this.insertData)) {
        return { data: inserted[0] || null, error: null };
      }
      return { data: inserted, error: null };
    }

    // 2. Handle UPDATE
    if (this.updateData != null) {
      let count = 0;
      const updated = [];
      const now = new Date().toISOString();
      for (let i = 0; i < table.length; i++) {
        let match = true;
        for (const f of this.filters) {
          if (f.type === 'eq' && String(table[i][f.col]) !== String(f.val)) match = false;
        }
        if (match) {
          table[i] = {
            ...table[i],
            ...this.updateData,
          };
          if (this.tableName !== 'categories') {
            table[i].updated_at = now;
          }
          updated.push(table[i]);
          count++;
        }
      }
      this.db.persist();
      return { data: updated, count, error: null };
    }

    // 3. Handle DELETE
    if (this.isDelete) {
      const remaining = [];
      const deleted = [];
      for (let i = 0; i < table.length; i++) {
        let match = true;
        for (const f of this.filters) {
          if (f.type === 'eq' && String(table[i][f.col]) !== String(f.val)) match = false;
        }
        if (match) {
          deleted.push(table[i]);
        } else {
          remaining.push(table[i]);
        }
      }
      this.db.tables[this.tableName] = remaining;
      this.db.persist();
      return { data: deleted, count: deleted.length, error: null };
    }

    // 4. Handle SELECT / QUERY
    let results = [...table];

    // Apply AND filters
    for (const f of this.filters) {
      if (f.type === 'eq') {
        results = results.filter((r) => {
          if (f.val === true || f.val === false) return Boolean(r[f.col]) === f.val;
          return String(r[f.col] ?? '') === String(f.val);
        });
      } else if (f.type === 'neq') {
        results = results.filter((r) => String(r[f.col] ?? '') !== String(f.val));
      } else if (f.type === 'ilike') {
        const clean = f.pattern.replace(/%/g, '').toLowerCase();
        results = results.filter((r) => String(r[f.col] ?? '').toLowerCase().includes(clean));
      } else if (f.type === 'not') {
        if (f.op === 'ilike') {
          const clean = (f.val || '').replace(/%/g, '').toLowerCase();
          results = results.filter((r) => {
            if (r[f.col] == null) return true; // keep nulls!
            return !String(r[f.col]).toLowerCase().includes(clean);
          });
        } else if (f.op === 'eq') {
          results = results.filter((r) => String(r[f.col] ?? '') !== String(f.val));
        } else if (f.op === 'is' && f.val === 'null') {
          results = results.filter((r) => r[f.col] != null);
        }
      } else if (f.type === 'is') {
        if (f.val === 'null') {
          results = results.filter((r) => r[f.col] == null);
        }
      }
    }

    // Apply OR filters
    for (const orStr of this.orFilters) {
      const orClauses = orStr.split(',').map((s) => s.trim()).filter(Boolean);
      results = results.filter((row) => orClauses.some((clause) => this._testOrCondition(row, clause)));
    }

    const totalCount = results.length;

    // Apply Orders
    if (this.orders.length > 0) {
      results.sort((a, b) => {
        for (const o of this.orders) {
          const valA = a[o.col];
          const valB = b[o.col];
          if (valA == null && valB == null) continue;
          if (valA == null) return o.ascending ? 1 : -1;
          if (valB == null) return o.ascending ? -1 : 1;
          if (valA < valB) return o.ascending ? -1 : 1;
          if (valA > valB) return o.ascending ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply limit / range
    if (this.limitCount != null) {
      results = results.slice(0, this.limitCount);
    } else if (this.rangeTo != null) {
      results = results.slice(this.rangeFrom, this.rangeTo + 1);
    }

    // Attach joined category name for listings when requested
    if (this.tableName === 'listings' && this.selectCols.includes('categories')) {
      const cats = this.db.getTable('categories');
      results = results.map((item) => {
        const cat = cats.find(
          (c) => Number(c.id) === Number(item.category_id) || String(c.id) === String(item.category_id)
        );
        return {
          ...item,
          categories: cat ? { name: cat.name, name_ml: cat.name_ml } : null,
        };
      });
    }

    if (this.isHead) {
      return { data: [], count: totalCount, error: null };
    }

    if (this.isSingle) {
      if (results.length === 0) return { data: null, error: { message: 'Row not found' }, count: totalCount };
      return { data: results[0], error: null, count: totalCount };
    }

    if (this.isMaybeSingle) {
      return { data: results[0] || null, error: null, count: totalCount };
    }

    return { data: results, count: totalCount, error: null };
  }

  then(onFulfilled, onRejected) {
    return this._execute().then(onFulfilled, onRejected);
  }
}

function createMockSupabaseClient() {
  return {
    from(table) {
      return new MockQueryBuilder(mockDb, table);
    },
    rpc(name) {
      if (name === 'is_admin') {
        return Promise.resolve({ data: Boolean(mockDb.currentUser), error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      async getUser() {
        return { data: { user: mockDb.currentUser }, error: null };
      },
      async getSession() {
        if (!mockDb.currentUser) return { data: { session: null }, error: null };
        return {
          data: {
            session: {
              user: mockDb.currentUser,
              access_token: 'mock-access-token',
            },
          },
          error: null,
        };
      },
      async signInWithPassword({ email }) {
        mockDb.currentUser = {
          id: 'demo-admin-uid',
          email: email || 'admin@pailippuram.local',
        };
        mockDb.persist();
        return {
          data: {
            user: mockDb.currentUser,
            session: { access_token: 'mock-access-token', user: mockDb.currentUser },
          },
          error: null,
        };
      },
      async signOut() {
        mockDb.currentUser = null;
        mockDb.persist();
        return { error: null };
      },
      onAuthStateChange(callback) {
        if (callback && mockDb.currentUser) {
          callback('SIGNED_IN', { user: mockDb.currentUser });
        }
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
    },
  };
}

export const supabase = isRealSupabaseConfigured
  ? createClient(url, key)
  : createMockSupabaseClient();
