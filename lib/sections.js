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
    fields: listingFields,
    fromSubmission: fromListing,
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
      const bgMatch = s.title?.match(/\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/i) || s.description?.match(/Blood Group:\s*([A-B-O\+]+)/i);
      const cleanName = s.title?.replace(/\s*\([A-B-O\+\s]+\)/i, '').trim();
      return {
        name: cleanName || s.title,
        blood_group: bgMatch ? bgMatch[1].toUpperCase() : 'O+',
        phone: s.phone,
        area: s.area,
        consent: s.consent,
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
      { name: 'extra', label: 'Phone or date', type: 'text' },
      { name: 'detail', label: 'Details', type: 'textarea' },
    ],
    fromSubmission: (s) => ({ title: s.title, detail: s.description, extra: s.phone }),
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

// Listings (and other rows) not checked for this many days are flagged "outdated".
export const OUTDATED_DAYS = 90;
