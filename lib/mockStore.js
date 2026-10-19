// In-memory mock database and query builder for Nammude Pailippuram
// Ensures the app boots and runs reliably in AI Studio without external network dependencies.

const STARTER_CATEGORIES = [
  { id: 1, kind: 'contact', name: 'Government Hospital / PHC', name_ml: 'സർക്കാർ ആശുപത്രി / പി.എച്ച്.സി' },
  { id: 2, kind: 'contact', name: 'Police Station', name_ml: 'പോലീസ് സ്റ്റേഷൻ' },
  { id: 3, kind: 'contact', name: 'Fire & Rescue Services', name_ml: 'ഫയർ & റെസ്ക്യൂ സർവീസ്' },
  { id: 4, kind: 'contact', name: 'Electricity Complaints (KSEB)', name_ml: 'കെ.എസ്.ഇ.ബി ഇലക്ട്രിസിറ്റി പരാതികൾ' },
  { id: 5, kind: 'contact', name: 'Akshaya Centre', name_ml: 'അക്ഷയ കേന്ദ്രം' },
  { id: 6, kind: 'contact', name: 'Post Office', name_ml: 'പോസ്റ്റ് ഓഫീസ്' },
  { id: 7, kind: 'contact', name: 'Banks & ATMs', name_ml: 'ബാങ്കുകൾ & എ.ടി.എം' },
  { id: 8, kind: 'contact', name: 'Women’s Helpline', name_ml: 'വനിതാ ഹെൽപ്പ്‌ലൈൻ' },
  { id: 9, kind: 'contact', name: 'Child Helpline', name_ml: 'ചൈൽഡ് ലൈൻ' },
  { id: 10, kind: 'business', name: 'Supermarkets', name_ml: 'സൂപ്പർമാർക്കറ്റുകൾ' },
  { id: 11, kind: 'business', name: 'Bakeries', name_ml: 'ബേക്കറികൾ' },
  { id: 12, kind: 'business', name: 'Pharmacies', name_ml: 'ഫാർമസികൾ / മരുന്നുകടകൾ' },
  { id: 13, kind: 'business', name: 'Hardware Shops', name_ml: 'ഹാർഡ്‌വെയർ കടകൾ' },
  { id: 14, kind: 'business', name: 'Tyre Shops', name_ml: 'ടയർ ഷോപ്പുകൾ' },
  { id: 15, kind: 'business', name: 'Textile & Clothing Shops', name_ml: 'ടെക്സ്റ്റൈൽസ് & വസ്ത്രക്കടകൾ' },
  { id: 16, kind: 'business', name: 'Hotels & Restaurants', name_ml: 'ഹോട്ടലുകൾ' },
  { id: 17, kind: 'business', name: 'Vegetable & Fruit Shops', name_ml: 'പച്ചക്കറി & പഴക്കടകൾ' },
  { id: 18, kind: 'business', name: 'Mobile Shops', name_ml: 'മൊബൈൽ കടകൾ' },
  { id: 19, kind: 'worker', name: 'Electricians', name_ml: 'ഇലക്ട്രീഷ്യന്മാർ' },
  { id: 20, kind: 'worker', name: 'Plumbers', name_ml: 'പ്ലംബർമാർ' },
  { id: 21, kind: 'worker', name: 'Carpenters', name_ml: 'ആശാരിമാർ (തച്ചന്മാർ)' },
  { id: 22, kind: 'worker', name: 'Painters', name_ml: 'പെയിന്റർമാർ' },
  { id: 23, kind: 'worker', name: 'Masons', name_ml: 'മേസൺമാർ' },
  { id: 24, kind: 'worker', name: 'Puncture Repair Workers', name_ml: 'പഞ്ചർ ഒട്ടിക്കുന്ന തൊഴിലാളികൾ' },
  { id: 25, kind: 'worker', name: 'AC & Refrigerator Technicians', name_ml: 'എ.സി & ഫ്രിഡ്ജ് ടെക്നീഷ്യന്മാർ' },
  { id: 26, kind: 'worker', name: 'Coconut Climber / Cutter', name_ml: 'തെങ്ങ് കയറ്റം / മരം മുറിക്കൽ' },
  { id: 27, kind: 'worker', name: 'Tile Workers', name_ml: 'ടൈൽ തൊഴിലാളികൾ' },
  { id: 28, kind: 'worker', name: 'Daily-Wage Labourers', name_ml: 'ദിവസവേതന തൊഴിലാളികൾ' },
  { id: 29, kind: 'transport', name: 'Auto-Rickshaw Drivers', name_ml: 'ഓട്ടോറിക്ഷ ഡ്രൈവർമാർ' },
  { id: 30, kind: 'transport', name: 'Taxi & Cab Services', name_ml: 'ടാക്സി & കാർ സർവീസുകൾ' },
  { id: 31, kind: 'transport', name: 'Goods Auto Services', name_ml: 'ഗുഡ്സ് ഓട്ടോ സർവീസ്' },
  { id: 32, kind: 'transport', name: 'Mini-Truck Services', name_ml: 'മിനി ട്രക്ക് & പിക്കപ്പ്' },
  { id: 33, kind: 'transport', name: 'Excavator / JCB Operators', name_ml: 'ജെ.സി.ബി & എർത്ത്മൂവർ' },
  { id: 34, kind: 'transport', name: 'Ambulance Transport', name_ml: 'ആംബുലൻസ് സർവീസ്' },
  { id: 35, kind: 'transport', name: 'Tourist Vehicle Services', name_ml: 'ട്രാവലർ / ടൂറിസ്റ്റ് വാൻ' },
];

const STARTER_LISTINGS = [
  // Contacts
  {
    id: 'l-c1',
    kind: 'contact',
    title: 'Primary Health Centre (PHC) Pailippuram',
    category_id: 1,
    phone: '0494 2420120',
    area: 'Hospital Road',
    description: 'Government Primary Health Centre. Outpatient consultations, immunizations, and maternal healthcare.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-c2',
    kind: 'contact',
    title: 'Tirur Police Station',
    category_id: 2,
    phone: '0494 2422233',
    area: 'Tirur Police Sub-Division',
    description: 'Emergency response, law enforcement and public assistance. Police Helpline: 112.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-c3',
    kind: 'contact',
    title: 'Fire & Rescue Services Station',
    category_id: 3,
    phone: '0494 2423101',
    area: 'Tirur Fire Substation',
    description: 'Emergency fire safety, flood rescue, accident response. Emergency line: 101.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-c4',
    kind: 'contact',
    title: 'KSEB Electrical Complaints Office',
    category_id: 4,
    phone: '0494 2422245',
    area: 'Pailippuram Electrical Section',
    description: 'Electricity breakdown, power interruption complaints, and emergency line repair. Toll free: 1912.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-c5',
    kind: 'contact',
    title: 'Akshaya e-Kendra Pailippuram',
    category_id: 5,
    phone: '9847123456',
    area: 'Pailippuram Junction',
    hours: '9:00 AM - 5:30 PM',
    description: 'Aadhaar registration and updates, income & caste certificates, e-district services, bill payments.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-c6',
    kind: 'contact',
    title: 'Pailippuram Sub Post Office',
    category_id: 6,
    phone: '0494 2420050',
    area: 'Post Office Road',
    hours: '9:00 AM - 4:00 PM',
    description: 'Postal speed post, parcel booking, India Post Payments Bank and savings schemes.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Shops
  {
    id: 'l-s1',
    kind: 'business',
    title: 'Pailippuram Hypermarket & Provision Store',
    category_id: 10,
    phone: '9846123789',
    area: 'Main Junction',
    hours: '7:00 AM - 10:00 PM',
    description: 'Comprehensive supermarket with fresh groceries, spices, dairy products, kitchenware and household essentials.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-s2',
    kind: 'business',
    title: 'Royal Bakery & Cool Bar',
    category_id: 11,
    phone: '9447456123',
    area: 'Near Bus Stop, Junction',
    hours: '8:00 AM - 10:30 PM',
    description: 'Fresh warm puffs, Malabar snacks, birthday cakes, cold juices, shakes and ice creams.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-s3',
    kind: 'business',
    title: 'Sanjeevani Medicals & Healthcare',
    category_id: 12,
    phone: '9895234567',
    area: 'Opposite Primary Health Centre',
    hours: '8:00 AM - 11:00 PM',
    description: 'All allopathic medicines, baby food and care products, surgical goods, and first-aid supplies.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-s4',
    kind: 'business',
    title: 'City Hardware, Paints & Electricals',
    category_id: 13,
    phone: '9745678901',
    area: 'South Pailippuram',
    hours: '8:30 AM - 8:30 PM',
    description: 'Building materials, Asian Paints tinting, PVC pipes, water pumps, wiring cables and tools.\nAlt Phones: 0494 2420440 (Landline)',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-s5',
    kind: 'business',
    title: 'Fresh Greens Fruit & Vegetable Mart',
    category_id: 17,
    phone: '9446781234',
    area: 'Bazaar Road',
    hours: '6:30 AM - 9:00 PM',
    description: 'Fresh local vegetables direct from farmers, hill-grown fruits, green leaves, coconuts and plantains.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Workers
  {
    id: 'l-w1',
    kind: 'worker',
    title: 'Suresh K - Licensed Electrical Technician',
    category_id: 19,
    phone: '9847234123',
    area: 'Pailippuram & Nearby',
    hours: '8:00 AM - 7:00 PM',
    description: '[WORKER]\nExperienced licensed electrician for house wiring, inverter setups, motor connections and troubleshooting.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-w2',
    kind: 'worker',
    title: 'Moideenkutty - Plumbing & Water Line Works',
    category_id: 20,
    phone: '9446345234',
    area: 'Angadi Road',
    hours: 'Prompt response for urgent repairs',
    description: '[WORKER]\nComplete plumbing contractor: PVC & CPVC piping, bathroom fittings, motor installation and tank cleaning.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-w3',
    kind: 'worker',
    title: 'Radhakrishnan - Master Carpenter',
    category_id: 21,
    phone: '9895456345',
    area: 'West Pailippuram',
    description: '[WORKER]\nSpecialized in teak and jackfruit wood furniture, door frames, window shutters, modular kitchen cabinets.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-w4',
    kind: 'worker',
    title: 'Shafi P - Painting & Wall Putty Specialist',
    category_id: 22,
    phone: '9745567456',
    area: 'South Pailippuram',
    description: '[WORKER]\nInterior wall putty finishing, exterior weather-shield painting, wood polish and epoxy waterproofing.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-w5',
    kind: 'worker',
    title: 'Velayudhan - Coconut Harvesting & Tree Pruning',
    category_id: 26,
    phone: '9447678567',
    area: 'Pailippuram',
    description: '[WORKER]\nTraditional skilled coconut climber using modern safety climbing equipment. Tree pruning and cleaning.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Transport
  {
    id: 'l-t1',
    kind: 'transport',
    title: 'Pailippuram Junction Auto-Rickshaw Stand',
    category_id: 29,
    phone: '9846789012',
    area: 'Junction Auto Stand',
    hours: '24 Hours Service',
    description: '[TRANSPORT]\nFast and friendly auto service for local commutes, station drops and medical emergencies. Drivers: Hamza (9846789012), Babu (9447112233).',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-t2',
    kind: 'transport',
    title: 'Pailippuram Cabs & Tourist Taxi (Innova / Ertiga)',
    category_id: 30,
    phone: '9745123456',
    area: 'Pailippuram',
    hours: '24/7 Outstation & Airport Service',
    description: '[TRANSPORT]\nComfortable 7-seater AC cars for Calicut / Cochin airport trips, hospital visits, Sabarimala and wedding hires.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-t3',
    kind: 'transport',
    title: 'Pailippuram Mini-Truck & Goods Pickup Transport',
    category_id: 31,
    phone: '9895012345',
    area: 'Bazaar Stand',
    description: '[TRANSPORT]\nPiaggio ape and Tata Ace pickup for house shifting, shop goods delivery and construction supplies.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-t4',
    kind: 'transport',
    title: 'Green Earth JCB 3DX & Excavator Operator',
    category_id: 33,
    phone: '9496001234',
    area: 'Pailippuram & Nearby Wards',
    description: '[TRANSPORT]\nHeavy equipment for foundation excavation, plot cleaning, land leveling, well and drainage digging.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const STARTER_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: '📌 ഗ്രാമപഞ്ചായത്ത് സൗജന്യ വയോജന മെഡിക്കൽ ക്യാമ്പ് (Free Geriatric Health Camp)',
    body: '[PINNED]\nപൈലിപ്പുറം കമ്മ്യൂണിറ്റി ഹാളിൽ ഈ വരുന്ന ഞായറാഴ്ച രാവിലെ 9:00 മണി മുതൽ ഉച്ചയ്ക്ക് 1:00 മണി വരെ സൗജന്യ ജനറൽ & നേത്ര പരിശോധനാ ക്യാമ്പ് സംഘടിപ്പിക്കുന്നു. മുതിർന്ന പൗരന്മാർക്ക് സൗജന്യ മരുന്നുകളും കണ്ണ് പരിശോധനയും ഉണ്ടായിരിക്കും.',
    event_date: '2026-10-25',
    is_pinned: true,
    status: 'approved',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ann-2',
    title: 'ഹരിത കർമ്മ സേന അജൈവ മാലിന്യ ശേഖരണം (Plastic Waste Collection)',
    body: 'പൈലിപ്പുറത്തെ എല്ലാ വാർഡുകളിലും അടുത്ത തിങ്കളാഴ്ച മുതൽ ഹരിത കർമ്മ സേനയുടെ നേതൃത്വത്തിൽ കഴുകി വൃത്തിയാക്കിയ പ്ലാസ്റ്റിക് മാലിന്യങ്ങൾ ശേഖരിക്കും. വീടുകളിലും സ്ഥാപനങ്ങളിലും കൃത്യമായി തരംതിരിച്ചു നൽകുക.',
    event_date: '2026-10-22',
    is_pinned: false,
    status: 'approved',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ann-3',
    title: 'കുടിവെള്ള പൈപ്പ് ലൈൻ അറ്റകുറ്റപ്പണി അറിയിപ്പ്',
    body: 'പ്രധാന കുടിവെള്ള പൈപ്പ് ലൈനിൽ അറ്റകുറ്റപ്പണി നടക്കുന്നതിനാൽ നാളെ പൈലിപ്പുറം സൗത്ത് മേഖലയിൽ ജലവിതരണം ഭാഗികമായി തടസ്സപ്പെടും. ഉപഭോക്താക്കൾ മുൻകൂട്ടി ആവശ്യമായ കരുതലുകൾ എടുക്കുക.',
    event_date: '2026-10-20',
    is_pinned: false,
    status: 'approved',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const STARTER_BUS_ROUTES = [
  {
    id: 'bus-1',
    route: 'തിരൂർ - പൈലിപ്പുറം - പൊന്നാനി (Tirur - Pailippuram - Ponnani)',
    bus_name: 'Star Line / Royal Travels',
    direction: 'Both Ways',
    times: '06:45 AM\n08:15 AM\n10:30 AM\n01:15 PM\n03:45 PM\n05:30 PM\n07:15 PM',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bus-2',
    route: 'കുറ്റിപ്പുറം - പൈലിപ്പുറം - വളാഞ്ചേരി (Kuttippuram - Pailippuram - Valanchery)',
    bus_name: 'Al-Ameen / City Rider',
    direction: 'Both Ways',
    times: '07:10 AM\n09:20 AM\n11:40 AM\n02:00 PM\n04:15 PM\n06:20 PM\n08:10 PM',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bus-3',
    route: 'പൈലിപ്പുറം - ചമ്രവട്ടം - എടപ്പാൾ (Pailippuram - Chamravattom - Edappal)',
    bus_name: 'Kerala SRTC Ordinary',
    direction: 'Via Chamravattom Bridge',
    times: '07:00 AM\n09:45 AM\n12:30 PM\n03:15 PM\n06:00 PM',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const STARTER_DONORS = [
  {
    id: 'd-1',
    name: 'ഷംസുദ്ദീൻ പി (Shamsudheen P)',
    blood_group: 'O+',
    phone: '9847112233',
    area: 'Pailippuram South',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd-2',
    name: 'അഭിജിത്ത് കെ (Abhijith K)',
    blood_group: 'A+',
    phone: '9446223344',
    area: 'Junction',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd-3',
    name: 'ഫൈസൽ ടി (Faisal T)',
    blood_group: 'B+',
    phone: '9745334455',
    area: 'West Pailippuram',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd-4',
    name: 'നിതിൻ രാജ് (Nithin Raj)',
    blood_group: 'AB+',
    phone: '9895445566',
    area: 'School Padi',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd-5',
    name: 'മുഹമ്മദ് അലി (Muhammed Ali)',
    blood_group: 'O-',
    phone: '9495556677',
    area: 'North Ward',
    available: true,
    consent: true,
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const STARTER_PANCHAYATH = [
  {
    id: 'p-1',
    section: 'bearer',
    title: 'Grama Panchayat President / പ്രസിഡന്റ്',
    detail: 'Panchayat Office, Open Mon-Sat 10:00 AM - 5:00 PM. Responsible for general executive administration and civic welfare schemes.',
    extra: '0494 2420100',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p-2',
    section: 'bearer',
    title: 'Vice-President / വൈസ് പ്രസിഡന്റ്',
    detail: 'Panchayat Administrative Committee head for public work monitoring and local development projects.',
    extra: '0494 2420101',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p-3',
    section: 'ward',
    title: 'Ward 1 Member - North Pailippuram',
    detail: 'Elected representative for North Pailippuram ward. Contact for road repair, streetlights, and local welfare petitions.',
    extra: '9447001122',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p-4',
    section: 'ward',
    title: 'Ward 2 Member - South Pailippuram',
    detail: 'Elected representative for South Pailippuram ward. Available for resident coordination and developmental initiatives.',
    extra: '9447002233',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p-5',
    section: 'service',
    title: 'Birth, Death & Marriage Registration',
    detail: 'Civil registrations under Kerala Local Bodies. Apply through Sevana service portal or directly at the Front Office with required hospital paperwork.',
    extra: 'Front Office Counter',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p-6',
    section: 'service',
    title: 'Property Tax & Building Permit (Sanchaya)',
    detail: 'Assessment of property tax, building ownership transfer, building permit sanctioning via Engineering Wing.',
    extra: 'Engineering Section',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p-7',
    section: 'notice',
    title: 'Grama Sabha Ward Meeting Calendar',
    detail: 'Ward level Grama Sabha meetings will be held this month to finalize proposals for upcoming annual plan funding.',
    extra: 'Notice Board',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const STARTER_SUBMISSIONS = [
  {
    id: 'sub-1',
    type: 'transport',
    title: 'Ali Auto Service & Stand',
    description: '[TRANSPORT]\nAvailable 24 hours at Pailippuram Station stand. Hospital emergency trip priority.',
    phone: '9846998877',
    area: 'Railway Station Road',
    submitter_contact: 'Ali (9846998877)',
    consent: true,
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

const STARTER_AUDIT_LOGS = [
  {
    id: 1,
    admin_id: 'admin-1',
    admin_email: 'admin@pailippuram.local',
    action: 'initial setup',
    table_name: 'listings',
    row_id: 'system',
    note: 'In-memory directory database active for Pailippuram',
    changes: null,
    created_at: new Date().toISOString(),
  },
];

class MockMemoryStore {
  constructor() {
    this.tables = {
      categories: [...STARTER_CATEGORIES],
      listings: [...STARTER_LISTINGS],
      announcements: [...STARTER_ANNOUNCEMENTS],
      bus_routes: [...STARTER_BUS_ROUTES],
      donors: [...STARTER_DONORS],
      panchayath_items: [...STARTER_PANCHAYATH],
      submissions: [...STARTER_SUBMISSIONS],
      audit_logs: [...STARTER_AUDIT_LOGS],
    };
    this.currentUser = { id: 'admin-1', email: 'admin@pailippuram.local' };
    this.loadFromStorage();
  }

  loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const saved = window.localStorage.getItem('pailippuram_mock_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            if (Array.isArray(v) && v.length > 0) {
              this.tables[k] = v;
            }
          }
        }
      }
      const userSaved = window.localStorage.getItem('pailippuram_admin_user');
      if (userSaved) {
        this.currentUser = JSON.parse(userSaved);
      }
    } catch {
      // ignore storage errors
    }
  }

  saveToStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem('pailippuram_mock_db', JSON.stringify(this.tables));
      if (this.currentUser) {
        window.localStorage.setItem('pailippuram_admin_user', JSON.stringify(this.currentUser));
      } else {
        window.localStorage.removeItem('pailippuram_admin_user');
      }
    } catch {
      // ignore storage errors
    }
  }

  getTable(name) {
    if (!this.tables[name]) {
      this.tables[name] = [];
    }
    return this.tables[name];
  }
}

// Global store instance shared across calls
const memoryStore = new MockMemoryStore();

// Attach joined category to listings for convenient access
function attachCategory(row, categories) {
  if (!row) return row;
  if (row.categories) return row;
  if (row.category_id != null) {
    const cat = categories.find((c) => c.id === row.category_id);
    if (cat) {
      return {
        ...row,
        categories: { name: cat.name, name_ml: cat.name_ml },
      };
    }
  }
  return { ...row, categories: null };
}

export class MockQueryBuilder {
  constructor(store, tableName) {
    this.store = store;
    this.tableName = tableName;
    this.filters = [];
    this.sortCol = null;
    this.sortAsc = true;
    this.limitCount = null;
    this.offsetCount = 0;
    this.isSingle = false;
    this.isHead = false;
    this.countMode = null;
  }

  select(fields = '*', options = {}) {
    if (options && options.count) {
      this.countMode = options.count;
    }
    if (options && options.head) {
      this.isHead = true;
    }
    return this;
  }

  eq(column, value) {
    this.filters.push((item) => {
      if (value === null) return item[column] === null || item[column] === undefined;
      return String(item[column]) === String(value);
    });
    return this;
  }

  neq(column, value) {
    this.filters.push((item) => String(item[column]) !== String(value));
    return this;
  }

  ilike(column, pattern) {
    const cleanPattern = pattern.replace(/^%|%$/g, '').toLowerCase();
    this.filters.push((item) => {
      const val = String(item[column] || '').toLowerCase();
      return val.includes(cleanPattern);
    });
    return this;
  }

  or(expression) {
    if (!expression) return this;
    const parts = expression.split(',').map((p) => p.trim()).filter(Boolean);
    this.filters.push((item) => {
      for (const part of parts) {
        if (part.includes('.eq.')) {
          const [col, val] = part.split('.eq.');
          if (String(item[col.trim()]) === String(val.trim())) return true;
        } else if (part.includes('.ilike.')) {
          const [col, pat] = part.split('.ilike.');
          const clean = pat.replace(/^%|%$/g, '').toLowerCase();
          const val = String(item[col.trim()] || '').toLowerCase();
          if (val.includes(clean)) return true;
        } else if (part.includes('.is.null')) {
          const col = part.replace('.is.null', '').trim();
          if (item[col] == null) return true;
        } else if (part.includes('.lt.')) {
          const [col, val] = part.split('.lt.');
          const itemVal = item[col.trim()];
          if (itemVal && new Date(itemVal) < new Date(val.trim())) return true;
        }
      }
      return false;
    });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.sortCol = column;
    this.sortAsc = ascending;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  range(from, to) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  async insert(rowOrRows) {
    const table = this.store.getTable(this.tableName);
    const items = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
    const inserted = [];

    for (const item of items) {
      const newRow = {
        ...item,
        id: item.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      table.unshift(newRow);
      inserted.push(newRow);
    }
    this.store.saveToStorage();

    const result = Array.isArray(rowOrRows) ? inserted : inserted[0];
    return { data: result, error: null };
  }

  async update(patch) {
    const table = this.store.getTable(this.tableName);
    let matchedCount = 0;
    const updated = [];

    for (let i = 0; i < table.length; i++) {
      const item = table[i];
      let matches = true;
      for (const filter of this.filters) {
        if (!filter(item)) {
          matches = false;
          break;
        }
      }
      if (matches) {
        table[i] = {
          ...item,
          ...patch,
          updated_at: new Date().toISOString(),
        };
        updated.push(table[i]);
        matchedCount++;
      }
    }
    this.store.saveToStorage();

    return { data: updated, error: null, count: matchedCount };
  }

  async delete() {
    const table = this.store.getTable(this.tableName);
    const kept = [];
    const deleted = [];

    for (const item of table) {
      let matches = true;
      for (const filter of this.filters) {
        if (!filter(item)) {
          matches = false;
          break;
        }
      }
      if (matches) {
        deleted.push(item);
      } else {
        kept.push(item);
      }
    }

    this.store.tables[this.tableName] = kept;
    this.store.saveToStorage();

    return { data: deleted, error: null, count: deleted.length };
  }

  async execute() {
    const rawTable = this.store.getTable(this.tableName);
    const categories = this.store.getTable('categories');

    // Attach categories to listings if querying listings
    let list = rawTable;
    if (this.tableName === 'listings') {
      list = rawTable.map((item) => attachCategory(item, categories));
    }

    // Apply all filters
    for (const filter of this.filters) {
      list = list.filter(filter);
    }

    const totalCount = list.length;

    // Apply sorting
    if (this.sortCol) {
      const col = this.sortCol;
      const asc = this.sortAsc;
      list = [...list].sort((a, b) => {
        const valA = a[col] != null ? a[col] : '';
        const valB = b[col] != null ? b[col] : '';
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (this.offsetCount > 0) {
      list = list.slice(this.offsetCount);
    }
    if (this.limitCount != null) {
      list = list.slice(0, this.limitCount);
    }

    if (this.isHead) {
      return { data: [], error: null, count: totalCount };
    }

    if (this.isSingle) {
      return {
        data: list[0] || null,
        error: list[0] ? null : { message: 'Row not found' },
        count: totalCount,
      };
    }

    return {
      data: list,
      error: null,
      count: totalCount,
    };
  }

  // Thenable for await support
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

export function createMockSupabaseClient() {
  return {
    from(tableName) {
      return new MockQueryBuilder(memoryStore, tableName);
    },
    auth: {
      async getUser() {
        return { data: { user: memoryStore.currentUser }, error: null };
      },
      async getSession() {
        return {
          data: {
            session: memoryStore.currentUser ? { user: memoryStore.currentUser } : null,
          },
          error: null,
        };
      },
      async signInWithPassword({ email }) {
        memoryStore.currentUser = {
          id: 'admin-1',
          email: email || 'admin@pailippuram.local',
        };
        memoryStore.saveToStorage();
        return { data: { user: memoryStore.currentUser }, error: null };
      },
      async signOut() {
        memoryStore.currentUser = null;
        memoryStore.saveToStorage();
        return { error: null };
      },
      onAuthStateChange(callback) {
        if (typeof callback === 'function') {
          callback('SIGNED_IN', memoryStore.currentUser ? { user: memoryStore.currentUser } : null);
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
    async rpc(funcName) {
      if (funcName === 'is_admin') {
        return { data: true, error: null };
      }
      return { data: null, error: null };
    },
  };
}

export { memoryStore };
