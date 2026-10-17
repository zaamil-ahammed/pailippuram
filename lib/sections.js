// One description of every kind of content the admin can manage.
// The admin list page and the admin edit page are both built from this,
// so adding a field here adds it to the form. Nothing is repeated per section.

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const PANCHAYATH_SECTIONS = [
  { value: 'bearer', label: 'Office bearer' },
  { value: 'ward', label: 'Ward member' },
  { value: 'service', label: 'Service' },
  { value: 'notice', label: 'Notice' },
];

const listingFields = [
  { name: 'title', label: 'Name', type: 'text', required: true },
  { name: 'category_id', label: 'Category', type: 'category' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'whatsapp', label: 'WhatsApp number (if different)', type: 'tel' },
  { name: 'area', label: 'Area', type: 'text' },
  { name: 'hours', label: 'Opening hours', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

const workerFields = [
  { name: 'title', label: 'Name / പേര്', type: 'text', required: true },
  { name: 'photo_url', label: 'Profile Photo / ഫോട്ടോ', type: 'image' },
  { name: 'category_id', label: 'Category / തൊഴിൽ വിഭാഗം', type: 'category' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'whatsapp', label: 'WhatsApp number (if different)', type: 'tel' },
  { name: 'area', label: 'Area / സ്ഥലം', type: 'text' },
  { name: 'hours', label: 'Working hours / സമയം', type: 'text' },
  { name: 'description', label: 'Description / ജോലി വിവരങ്ങൾ', type: 'textarea' },
];

const fromListing = (s) => {
  const waMatch = s.description?.match(/WhatsApp:\s*([^\n]+)/i);
  const hoursMatch = s.description?.match(/Hours:\s*([^\n]+)/i) || s.description?.match(/Availability:\s*([^\n]+)/i);
  return {
    title: s.title,
    description: s.description,
    phone: s.phone,
    whatsapp: waMatch ? waMatch[1].trim() : '',
    area: s.area,
    hours: hoursMatch ? hoursMatch[1].trim() : '',
  };
};

const fromWorkerListing = (s) => {
  const base = fromListing(s);
  const photoMatch = s.description?.match(/Photo:\s*([^\n]+)/i);
  return {
    ...base,
    photo_url: s.photo_url || (photoMatch ? photoMatch[1].trim() : ''),
  };
};

export const SECTIONS = {
  contacts: {
    label: 'Important contacts',
    singular: 'contact',
    table: 'listings',
    match: { kind: 'contact' },
    select: '*, categories(name)',
    searchCols: ['title', 'area', 'description'],
    title: (r) => r.title,
    subtitle: (r) => [r.categories?.name, r.area].filter(Boolean).join(' · '),
    verify: true,
    fields: listingFields,
    fromSubmission: fromListing,
  },
  shops: {
    label: 'Local shops',
    singular: 'shop',
    table: 'listings',
    match: { kind: 'business' },
    select: '*, categories(name)',
    searchCols: ['title', 'area', 'description'],
    title: (r) => r.title,
    subtitle: (r) => [r.categories?.name, r.area].filter(Boolean).join(' · '),
    verify: true,
    fields: listingFields,
    fromSubmission: fromListing,
  },
  workers: {
    label: 'Native workers',
    singular: 'worker',
    table: 'listings',
    match: { kind: 'worker' },
    select: '*, categories(name)',
    searchCols: ['title', 'area', 'description'],
    title: (r) => r.title,
    subtitle: (r) => [r.categories?.name, r.area].filter(Boolean).join(' · '),
    verify: true,
    fields: workerFields,
    fromSubmission: fromWorkerListing,
  },
  transport: {
    label: 'Transportation services',
    singular: 'driver / vehicle',
    table: 'listings',
    match: { kind: 'transport' },
    select: '*, categories(name)',
    searchCols: ['title', 'area', 'description'],
    title: (r) => r.title,
    subtitle: (r) => [r.categories?.name, r.area].filter(Boolean).join(' · '),
    verify: true,
    fields: [
      { name: 'title', label: 'Driver or Service Name', type: 'text', required: true },
      { name: 'category_id', label: 'Vehicle Type / Category', type: 'category' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'whatsapp', label: 'WhatsApp number (if different)', type: 'tel' },
      { name: 'area', label: 'Stand / Location (e.g. Junction Stand)', type: 'text' },
      { name: 'hours', label: 'Working hours / Available times', type: 'text' },
      { name: 'description', label: 'Vehicle details (e.g. Auto, 7-seater Innova, JCB 3DX, Pickup 407)', type: 'textarea' },
    ],
    fromSubmission: fromListing,
  },
  bus: {
    label: 'Bus timing',
    singular: 'bus route',
    table: 'bus_routes',
    match: {},
    select: '*',
    searchCols: ['route', 'bus_name'],
    title: (r) => r.route,
    subtitle: (r) => r.bus_name || '',
    verify: true,
    fields: [
      { name: 'route', label: 'Route (From to To)', type: 'text', required: true },
      { name: 'bus_name', label: 'Bus name or number', type: 'text' },
      { name: 'times', label: 'Departure times (one per line)', type: 'textarea' },
    ],
    fromSubmission: (s) => {
      const busNameMatch = s.description?.match(/Bus Name:\s*([^\n]+)/i);
      const timesMatch = s.description?.match(/Times:\s*([\s\S]+)/i);
      return {
        route: s.title,
        bus_name: busNameMatch ? busNameMatch[1].trim() : '',
        times: timesMatch ? timesMatch[1].trim() : s.description || '',
      };
    },
  },
  donors: {
    label: 'Blood donors',
    singular: 'donor',
    table: 'donors',
    match: {},
    select: '*',
    searchCols: ['name', 'area', 'blood_group'],
    title: (r) => `${r.name} (${r.blood_group})`,
    subtitle: (r) => [r.area, r.available ? '' : 'Not available now'].filter(Boolean).join(' · '),
    verify: true,
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'blood_group', label: 'Blood group', type: 'select', options: BLOOD_GROUPS.map((g) => ({ value: g, label: g })), required: true },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'area', label: 'Area', type: 'text' },
      { name: 'available', label: 'Available to donate now', type: 'checkbox', default: true },
      { name: 'consent', label: 'This person agreed to be listed', type: 'checkbox', default: false, required: true },
    ],
    fromSubmission: (s) => {
      const bgMatch = s.title?.match(/\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/i) || s.description?.match(/Blood Group:\s*([A-Za-z0-9+-]+)/i);
      const cleanName = s.title?.replace(/\s*\([A-Za-z0-9+-\s]+\)/i, '').trim();
      return {
        name: cleanName || s.title,
        blood_group: bgMatch ? bgMatch[1].toUpperCase() : 'O+',
        phone: s.phone,
        area: s.area,
        available: true,
        consent: s.consent !== false,
      };
    },
  },
  panchayath: {
    label: 'Panchayath',
    singular: 'panchayath item',
    table: 'panchayath_items',
    match: {},
    select: '*',
    searchCols: ['title', 'detail'],
    title: (r) => r.title,
    subtitle: (r) => PANCHAYATH_SECTIONS.find((s) => s.value === r.section)?.label || r.section,
    verify: true,
    fields: [
      { name: 'section', label: 'Section', type: 'select', options: PANCHAYATH_SECTIONS, required: true },
      { name: 'title', label: 'Name or title', type: 'text', required: true },
      { name: 'photo_url', label: 'Profile Photo / ചിത്രം (for President, Secretary, Ward Member)', type: 'image' },
      { name: 'extra', label: 'Phone or date', type: 'text' },
      { name: 'detail', label: 'Details', type: 'textarea' },
    ],
    fromSubmission: (s) => ({ title: s.title, detail: s.description, extra: s.phone, photo_url: s.photo_url || '' }),
  },
  announcements: {
    label: 'Announcements',
    singular: 'announcement',
    table: 'announcements',
    match: {},
    select: '*',
    searchCols: ['title', 'body'],
    title: (r) => r.title,
    subtitle: (r) => r.event_date || '',
    verify: false,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'event_date', label: 'Date (optional)', type: 'date' },
      { name: 'body', label: 'Details', type: 'textarea' },
    ],
    fromSubmission: (s) => ({ title: s.title, body: s.description }),
  },
  categories: {
    label: 'Categories of menus',
    singular: 'category',
    table: 'categories',
    match: {},
    select: '*',
    searchCols: ['name', 'name_ml', 'kind'],
    title: (r) => `${r.name}${r.name_ml ? ' · ' + r.name_ml : ''}`,
    subtitle: (r) => {
      const menuLabels = {
        business: 'Local Shops (കടകൾ)',
        contact: 'Important Contacts (പ്രധാന നമ്പറുകൾ)',
        worker: 'Native Workers (തൊഴിലാളികൾ)',
        transport: 'Transportation (വാഹനങ്ങൾ / ടാക്സി)',
      };
      return menuLabels[r.kind] || r.kind || 'Menu category';
    },
    verify: false,
    fields: [
      {
        name: 'kind',
        label: 'Menu / Section (വിഭാഗം)',
        type: 'select',
        options: [
          { value: 'business', label: 'Local Shops (കടകൾ)' },
          { value: 'contact', label: 'Important Contacts (പ്രധാന നമ്പറുകൾ)' },
          { value: 'worker', label: 'Native Workers (തൊഴിലാളികൾ)' },
          { value: 'transport', label: 'Transportation (വാഹനങ്ങൾ / ടാക്സി)' },
        ],
        required: true,
      },
      { name: 'name', label: 'Category Name (English)', type: 'text', required: true },
      { name: 'name_ml', label: 'Category Name in Malayalam (മലയാളം)', type: 'text' },
    ],
    fromSubmission: (s) => ({ name: s.title, kind: 'business' }),
  },
};

export const SECTION_KEYS = Object.keys(SECTIONS);

// Which admin section a visitor submission belongs to.
export const SUBMISSION_SECTION = {
  business: 'shops',
  contact: 'contacts',
  worker: 'workers',
  transport: 'transport',
  announcement: 'announcements',
  donor: 'donors',
  bus: 'bus',
};

export const SUBMISSION_LABEL = {
  business: 'New shop',
  contact: 'New contact',
  worker: 'New worker / trade',
  transport: 'New taxi / auto / transport',
  announcement: 'New announcement',
  donor: 'New blood donor',
  bus: 'Bus timing',
  other: 'Other',
  correction: 'Correction',
  removal: 'Removal request',
};

// Intelligently detects the true intended admin section even if remote database constraints
// forced a fallback to contact/other.
export function getSubmissionSection(r) {
  if (!r) return null;
  if (r.type === 'removal' || r.type === 'correction') return null;

  // 1. Explicit type if known and not fallback contact/other
  if (r.type && r.type !== 'contact' && r.type !== 'other' && SUBMISSION_SECTION[r.type]) {
    return SUBMISSION_SECTION[r.type];
  }

  // 2. Check for tag [TAG] in description
  const tagMatch = r.description?.match(/^\[(DONOR|TRANSPORT|WORKER|BUS|SHOP|BUSINESS|ANNOUNCEMENT)\]/i);
  if (tagMatch) {
    const tag = tagMatch[1].toUpperCase();
    if (tag === 'DONOR') return 'donors';
    if (tag === 'TRANSPORT') return 'transport';
    if (tag === 'WORKER') return 'workers';
    if (tag === 'BUS') return 'bus';
    if (tag === 'SHOP' || tag === 'BUSINESS') return 'shops';
    if (tag === 'ANNOUNCEMENT') return 'announcements';
  }

  // 3. Content markers in title or description
  if (r.description?.includes('Blood Group:') || /\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/i.test(r.title)) return 'donors';
  if (r.description?.includes('Bus Type:') || r.description?.includes('Bus Name:') || r.description?.includes('Departure Times:')) return 'bus';
  if (r.description?.includes('Vehicle Type:') || r.description?.includes('Vehicle Model:')) return 'transport';
  if (r.description?.includes('Trade / Skill:') || r.description?.includes('Work details:')) return 'workers';
  if (r.description?.includes('About Shop:') || r.description?.includes('Shop Category:')) return 'shops';

  return SUBMISSION_SECTION[r.type] || 'contacts';
}

export function getSubmissionLabel(r) {
  if (r.type === 'removal') return 'Removal request';
  if (r.type === 'correction') return 'Correction';
  const sec = getSubmissionSection(r);
  if (sec === 'donors') return 'New blood donor';
  if (sec === 'transport') return 'New taxi / auto / transport';
  if (sec === 'workers') return 'New worker / trade';
  if (sec === 'shops') return 'New shop';
  if (sec === 'bus') return 'Bus timing';
  if (sec === 'announcements') return 'New announcement';
  if (sec === 'contacts') return 'New contact';
  return SUBMISSION_LABEL[r.type] || 'Submission';
}

// Listings (and other rows) not checked for this many days are flagged "outdated".
export const OUTDATED_DAYS = 90;
