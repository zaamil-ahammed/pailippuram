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
  { id: 36, kind: 'contact', name: 'Schools & Colleges', name_ml: 'സ്കൂളുകൾ & വിദ്യാലയങ്ങൾ' },
  { id: 37, kind: 'contact', name: 'Madrassas & Dars', name_ml: 'മദ്രസകൾ & ദർസുകൾ' },

  // Education & Institutions
  { id: 38, kind: 'education', name: 'Higher Secondary & High Schools', name_ml: 'ഹയർ സെക്കൻഡറി & ഹൈസ്കൂളുകൾ' },
  { id: 39, kind: 'education', name: 'Primary & UP Schools', name_ml: 'പ്രൈമറി & യു.പി സ്കൂളുകൾ' },
  { id: 40, kind: 'education', name: 'Madrassas & Islamic Dars', name_ml: 'മദ്രസകൾ & ദർസുകൾ' },
  { id: 41, kind: 'education', name: 'Anganwadis & Pre-Schools', name_ml: 'അങ്കണവാടികൾ & പ്രീ-സ്കൂളുകൾ' },
  { id: 42, kind: 'education', name: 'Tuition Centres & Academies', name_ml: 'ട്യൂഷൻ സെന്ററുകൾ & അക്കാദമികൾ' },
  { id: 43, kind: 'education', name: 'Daycare & Nursery', name_ml: 'ഡേകെയർ & നഴ്സറി' },

  // Panchayath & Local Governance
  { id: 44, kind: 'panchayath', name: 'Elected Grama Panchayat Members', name_ml: 'ജനപ്രതിനിധികൾ & വാർഡ് മെമ്പർമാർ' },
  { id: 45, kind: 'panchayath', name: 'Health & Public Sanitation', name_ml: 'ആരോഗ്യം & പൊതു ശുചിത്വം' },
  { id: 46, kind: 'panchayath', name: 'Haritha Karma Sena / Waste Removal', name_ml: 'ഹരിത കർമ്മസേന / മാലിന്യ നിർമ്മാർജ്ജനം' },
  { id: 47, kind: 'panchayath', name: 'Kudumbashree Community Wing', name_ml: 'കുടുംബശ്രീ കമ്മ്യൂണിറ്റി വിഭാഗം' },
  { id: 48, kind: 'panchayath', name: 'Public Works & Road Maintenance', name_ml: 'പൊതുമരാമത്ത് & റോഡ് പരിപാലനം' },
  { id: 49, kind: 'panchayath', name: 'Village Office & Revenue Services', name_ml: 'വില്ലേജ് ഓഫീസ് & റവന്യൂ സേവനങ്ങൾ' },

  // Announcements & Official News
  { id: 50, kind: 'announcement', name: 'Emergency & Weather Alerts', name_ml: 'അടിയന്തര അറിയിപ്പുകൾ & കാലാവസ്ഥ' },
  { id: 51, kind: 'announcement', name: 'Grama Sabha & Official Circulars', name_ml: 'ഗ്രാമപഞ്ചായത്ത് സർക്കുലറുകൾ' },
  { id: 52, kind: 'announcement', name: 'Cultural & Arts Events', name_ml: 'സാംസ്കാരിക & കലാ പരിപാടികൾ' },
  { id: 53, kind: 'announcement', name: 'Sports & Football Tournaments', name_ml: 'കായിക മത്സരങ്ങൾ & ടൂർണമെന്റുകൾ' },
  { id: 54, kind: 'announcement', name: 'Obituary & Condolence Notices', name_ml: 'അനുശോചനങ്ങൾ & വിയോഗങ്ങൾ' },

  // Blood Donors
  { id: 55, kind: 'donor', name: 'A+ Positive Blood Donors', name_ml: 'A+ പോസിറ്റീവ് രക്തദാതാക്കൾ' },
  { id: 56, kind: 'donor', name: 'B+ Positive Blood Donors', name_ml: 'B+ പോസിറ്റീവ് രക്തദാതാക്കൾ' },
  { id: 57, kind: 'donor', name: 'O+ Positive Blood Donors', name_ml: 'O+ പോസിറ്റീവ് രക്തദാതാക്കൾ' },
  { id: 58, kind: 'donor', name: 'AB+ Positive Blood Donors', name_ml: 'AB+ പോസിറ്റീവ് രക്തദാതാക്കൾ' },
  { id: 59, kind: 'donor', name: 'Negative Blood Groups (Emergency)', name_ml: 'നെഗറ്റീവ് ഗ്രൂപ്പുകൾ (അടിയന്തര വിഭാഗം)' },
  { id: 60, kind: 'donor', name: 'Youth Club Blood Donor Wings', name_ml: 'യൂത്ത് ക്ലബ്ബ് ബ്ലഡ് വിങ്സ്' },

  // Bus Transit & Routes
  { id: 61, kind: 'bus', name: 'Pailippuram - Tirur Regular Buses', name_ml: 'പൈലിപ്പുറം - തിരൂർ ഓർഡിനറി ബസുകൾ' },
  { id: 62, kind: 'bus', name: 'Pailippuram - Kuttippuram Routes', name_ml: 'പൈലിപ്പുറം - കുറ്റിപ്പുറം റൂട്ട്' },
  { id: 63, kind: 'bus', name: 'Pailippuram - Valanchery Routes', name_ml: 'പൈലിപ്പുറം - വളാഞ്ചേരി റൂട്ട്' },
  { id: 64, kind: 'bus', name: 'Limited Stop & Fast Passengers', name_ml: 'ലിമിറ്റഡ് സ്റ്റോപ്പ് & ഫാസ്റ്റ് പാസഞ്ചർ' },

  // Victory Club Committee & Wings
  { id: 65, kind: 'victory', name: 'Executive Leadership', name_ml: 'എക്സിക്യൂട്ടീവ് നേതൃത്വം' },
  { id: 66, kind: 'victory', name: 'Key Portfolios (Finance, Sports, Media, Charity)', name_ml: 'വകുപ്പ് ചുമതലകൾ' },
  { id: 67, kind: 'victory', name: 'GCC Wing (Overseas Chapter)', name_ml: 'പ്രവാസി ചാപ്റ്റർ' },
  { id: 68, kind: 'victory', name: 'Central Committee', name_ml: 'സെൻട്രൽ കമ്മിറ്റി' },
  { id: 69, kind: 'victory', name: 'Arts & Sports Coordinators', name_ml: 'കലാ-കായിക കോഓർഡിനേറ്റർമാർ' },
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
  {
    id: 'l-ed1',
    kind: 'contact',
    title: 'GLPS Pailippuram',
    category_id: 36,
    phone: '0466 2261205',
    area: 'School Padi, Pailippuram',
    hours: '9:30 AM - 4:00 PM',
    description: '[EDUCATION] [SCHOOL]\nType: School · LP School\nRoles:\n- Headmistress (HM): Radha Teacher | 9446215890\n- Office Desk: 0466 2261205\n- PTA President: K.P. Hameed | 9847124356\n- School Bus In-Charge: Moideenkutty | 9846332112\nDetails: Government Lower Primary School established in 1958. Grades 1 to 4 with Malayalam & English medium.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-ed2',
    kind: 'contact',
    title: 'GUPS Thiruvegappura',
    category_id: 36,
    phone: '0466 2262114',
    whatsapp: '9447382910',
    area: 'Thiruvegappura Town',
    hours: '9:30 AM - 4:15 PM',
    description: '[EDUCATION] [SCHOOL]\nType: School · UP School\nRoles:\n- Headmaster (HM): K. Madhusoodanan | 9447382910\n- School Office: 0466 2262114\n- PTA President: C.P. Abdul Salam | 9847651234\n- MPTA President: Suhara K. | 9745123980\nDetails: Upper Primary School with modern smart classrooms, library, and active sports clubs.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-ed3',
    kind: 'contact',
    title: 'GHS Pailippuram',
    category_id: 36,
    phone: '0466 2263445',
    whatsapp: '9446554433',
    area: 'Pailippuram',
    hours: '9:00 AM - 4:30 PM',
    description: '[EDUCATION] [SCHOOL]\nType: School · High School\nRoles:\n- Headmaster (HM): M. K. Narayanan | 9446554433\n- High School Office: 0466 2263445\n- PTA President: T.P. Musthafa | 9847223344\n- Staff Secretary: Biju Master | 9495112233\n- School Bus Driver: Shaji | 9744889900\nDetails: High school covering standards 8 to 10 with high SSLC pass percentage, IT lab, and science club.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-ed4',
    kind: 'contact',
    title: 'Bafakhy Yatheem Khana HSS (BYK HSS)',
    category_id: 36,
    phone: '0494 2547220',
    whatsapp: '9447102938',
    area: 'Kalpakanchery / Pailippuram Region',
    hours: '9:00 AM - 4:30 PM',
    description: '[EDUCATION] [SCHOOL]\nType: School · Higher Secondary\nRoles:\n- Principal (HSS): Prof. Abdul Rasheed | 9447102938\n- Headmaster (High School): K.T. Moideen | 9846114477\n- Higher Secondary Office: 0494 2547220\n- PTA President: P.K. Bava Haji | 9847001122\nDetails: Reputed institution offering Science, Commerce, and Humanities streams with hostel and transport facilities.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-ed5',
    kind: 'contact',
    title: 'Al-Huda English Medium School',
    category_id: 36,
    phone: '0466 2264890',
    whatsapp: '9447891230',
    area: 'Valiyakunnu, Pailippuram',
    hours: '9:00 AM - 3:45 PM',
    description: '[EDUCATION] [SCHOOL]\nType: School · English Medium\nRoles:\n- Principal: Mary Thomas | 9447891230\n- Admissions & Office: 0466 2264890\n- School Van Coordinator: Haneefa | 9847334455\n- Management Secretary: V.P. Usman | 9946123450\nDetails: Co-educational English Medium institution with pre-primary, primary, and secondary sections.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-ed6',
    kind: 'contact',
    title: 'Hidayathul Muslimeen Madrassa',
    category_id: 37,
    phone: '9946221100',
    whatsapp: '9946221100',
    area: 'Pailippuram Juma Masjid Road',
    hours: '7:00 AM - 8:30 AM & 4:30 PM - 6:00 PM',
    description: '[EDUCATION] [MADRASSA]\nType: Madrassa · Primary & Secondary Madrassa\nRoles:\n- Sadar Ustad: Usthad Ibrahim Faizy | 9946221100\n- Committee President: P.K. Kunhimohammed Haji | 9847332211\n- General Secretary: K.T. Abdul Majeed | 9447225588\n- Madrasa Van Driver: Kabeer | 9846778899\nDetails: Recognized primary & secondary Islamic education centre offering moral studies and Quran recitation.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-ed7',
    kind: 'contact',
    title: 'Manarul Huda Madrassa',
    category_id: 37,
    phone: '0466 2262990',
    whatsapp: '9847556677',
    area: 'Thiruvegappura Town',
    hours: '6:45 AM - 8:15 AM',
    description: '[EDUCATION] [MADRASSA]\nType: Madrassa · Primary & Secondary\nRoles:\n- Sadar Ustad: Usthad Abdul Gafoor Baqawi | 9847556677\n- Madrasa Office: 0466 2262990\n- Committee President: T. Mohammedali | 9446334455\n- Parent Forum Convener: Faisal K. | 9846223344\nDetails: Established in 1974. Over 300 students enrolled across 10 classes with dedicated teachers.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-ed8',
    kind: 'contact',
    title: 'Sirajul Uloom Dars & Madrasa',
    category_id: 37,
    phone: '9947113355',
    whatsapp: '9947113355',
    area: 'Valiyakunnu, Pailippuram',
    hours: '6:30 AM - 8:00 AM',
    description: '[EDUCATION] [MADRASSA]\nType: Madrassa & Dars\nRoles:\n- Chief Mudarris / Sadar Ustad: Usthad Zainuddin Musliyar | 9947113355\n- Management President: C.H. Bappu Haji | 9847118899\n- Secretary: M.P. Saidalavi | 9447339900\n- Madrasa Vehicle Coordinator: Shoukath | 9745221133\nDetails: Islamic religious centre with higher Dars and morning Madrasa sessions.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-ed9',
    kind: 'contact',
    title: 'Madrassa Salafiyya Pailippuram',
    category_id: 37,
    phone: '9847990011',
    whatsapp: '9847990011',
    area: 'Nadaparambu, Pailippuram',
    hours: '6:45 AM - 8:15 AM',
    description: '[EDUCATION] [MADRASSA]\nType: Madrassa\nRoles:\n- Sadar Ustad: Usthad Anas Salafi | 9847990011\n- Convener: K. Abdul Rahman | 9446112288\n- Office / Enquiries: 9946881122\nDetails: Moral education, Tajweed classes, and value-based Islamic studies.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'l-ed10',
    kind: 'contact',
    title: 'Government Anganwadi Centre No. 42',
    category_id: 36,
    phone: '9495223344',
    whatsapp: '9495223344',
    area: 'School Padi, Ward 4',
    hours: '9:30 AM - 3:30 PM',
    description: '[EDUCATION] [SCHOOL]\nType: Anganwadi / Pre-Primary\nRoles:\n- Anganwadi Worker (AWW): Beena Teacher | 9495223344\n- Anganwadi Helper (AWH): Amina | 9847887766\n- Mothers Committee President: Shajiya K. | 9744112233\nDetails: Integrated Child Development Services (ICDS), nutrition, immunization, and pre-school education.',
    status: 'approved',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
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

export const STARTER_VICTORY_MEMBERS = [
  // Executive Officers
  {
    id: 'vm-1',
    name: 'Ansil',
    role: 'President',
    role_ml: 'പ്രസിഡന്റ്',
    wing: 'executive',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 1,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-2',
    name: 'Jilshad',
    role: 'Secretary',
    role_ml: 'ജനറൽ സെക്രട്ടറി',
    wing: 'executive',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 2,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-3',
    name: 'Shafeer',
    role: 'Club Operation',
    role_ml: 'ക്ലബ്ബ് ഓപ്പറേഷൻസ്',
    wing: 'executive',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 3,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Key Portfolios: Finance Controllers
  {
    id: 'vm-4',
    name: 'Sadik',
    role: 'Finance Controller',
    role_ml: 'ഫിനാൻസ് കൺട്രോളർ',
    wing: 'portfolios',
    portfolio: 'Finance Controllers',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 4,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-5',
    name: 'Ashik',
    role: 'Finance Controller',
    role_ml: 'ഫിനാൻസ് കൺട്രോളർ',
    wing: 'portfolios',
    portfolio: 'Finance Controllers',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 5,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Key Portfolios: Sports Managers
  {
    id: 'vm-6',
    name: 'Murshid',
    role: 'Sports Manager',
    role_ml: 'സ്പോർട്സ് മാനേജർ',
    wing: 'portfolios',
    portfolio: 'Sports Managers',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 6,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-7',
    name: 'Irfan',
    role: 'Sports Manager',
    role_ml: 'സ്പോർട്സ് മാനേജർ',
    wing: 'portfolios',
    portfolio: 'Sports Managers',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 7,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-8',
    name: 'Riyas Ali',
    role: 'Sports Manager',
    role_ml: 'സ്പോർട്സ് മാനേജർ',
    wing: 'portfolios',
    portfolio: 'Sports Managers',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 8,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Key Portfolios: Media & Communications
  {
    id: 'vm-9',
    name: 'Shihan',
    role: 'Media & PR',
    role_ml: 'മീഡിയ & പി.ആർ',
    wing: 'portfolios',
    portfolio: 'Media & Communications',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 9,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-10',
    name: 'Ahmed Shamil',
    role: 'Media & PR',
    role_ml: 'മീഡിയ & പി.ആർ',
    wing: 'portfolios',
    portfolio: 'Media & Communications',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 10,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Key Portfolios: Charity & Social Welfare
  {
    id: 'vm-11',
    name: 'Niyas',
    role: 'Charity & Welfare',
    role_ml: 'ചാരിറ്റി & ജനസേവനം',
    wing: 'portfolios',
    portfolio: 'Charity & Social Welfare',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 11,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-12',
    name: 'Iqbal',
    role: 'Charity & Welfare',
    role_ml: 'ചാരിറ്റി & ജനസേവനം',
    wing: 'portfolios',
    portfolio: 'Charity & Social Welfare',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 12,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // GCC Wing (1 to 6)
  {
    id: 'vm-13',
    name: 'Vivek',
    role: 'GCC Wing Member',
    role_ml: 'പ്രവാസി ചാപ്റ്റർ അംഗം',
    wing: 'gcc',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 1,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-14',
    name: 'Basil',
    role: 'GCC Wing Member',
    role_ml: 'പ്രവാസി ചാപ്റ്റർ അംഗം',
    wing: 'gcc',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 2,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-15',
    name: 'Shafi',
    role: 'GCC Wing Member',
    role_ml: 'പ്രവാസി ചാപ്റ്റർ അംഗം',
    wing: 'gcc',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 3,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-16',
    name: 'Yasar',
    role: 'GCC Wing Member',
    role_ml: 'പ്രവാസി ചാപ്റ്റർ അംഗം',
    wing: 'gcc',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 4,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-17',
    name: 'Nadirsha',
    role: 'GCC Wing Member',
    role_ml: 'പ്രവാസി ചാപ്റ്റർ അംഗം',
    wing: 'gcc',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 5,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-18',
    name: 'Abhijith',
    role: 'GCC Wing Member',
    role_ml: 'പ്രവാസി ചാപ്റ്റർ അംഗം',
    wing: 'gcc',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 6,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Central Committee (1 to 7)
  {
    id: 'vm-19',
    name: 'Shakir',
    role: 'Central Committee Member',
    role_ml: 'സെൻട്രൽ കമ്മിറ്റി അംഗം',
    wing: 'central',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 1,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-20',
    name: 'Faris PT',
    role: 'Central Committee Member',
    role_ml: 'സെൻട്രൽ കമ്മിറ്റി അംഗം',
    wing: 'central',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 2,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-21',
    name: 'Shabeeb',
    role: 'Central Committee Member',
    role_ml: 'സെൻട്രൽ കമ്മിറ്റി അംഗം',
    wing: 'central',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 3,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-22',
    name: 'Nisar',
    role: 'Central Committee Member',
    role_ml: 'സെൻട്രൽ കമ്മിറ്റി അംഗം',
    wing: 'central',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 4,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-23',
    name: 'Mujeeb',
    role: 'Central Committee Member',
    role_ml: 'സെൻട്രൽ കമ്മിറ്റി അംഗം',
    wing: 'central',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 5,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-24',
    name: 'Mahad',
    role: 'Central Committee Member',
    role_ml: 'സെൻട്രൽ കമ്മിറ്റി അംഗം',
    wing: 'central',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 6,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vm-25',
    name: 'Adhithyan',
    role: 'Central Committee Member',
    role_ml: 'സെൻട്രൽ കമ്മിറ്റി അംഗം',
    wing: 'central',
    portfolio: '',
    photo_url: '',
    link: 'https://www.instagram.com/victory_pailippuram',
    phone: '',
    display_order: 7,
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
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
      victory_members: [...STARTER_VICTORY_MEMBERS],
    };
    this.currentUser = null; // Do NOT auto-login. Require password.
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

      // Ensure all starter categories exist even if old storage is present
      if (!this.tables.categories || this.tables.categories.length === 0) {
        this.tables.categories = [...STARTER_CATEGORIES];
      } else {
        const existingNames = new Set(this.tables.categories.map((c) => `${c.kind || ''}:${(c.name || '').toLowerCase()}`));
        for (const cat of STARTER_CATEGORIES) {
          const key = `${cat.kind || ''}:${(cat.name || '').toLowerCase()}`;
          if (!existingNames.has(key)) {
            this.tables.categories.push(cat);
          }
        }
      }

      if (!this.tables.victory_members || this.tables.victory_members.length === 0) {
        this.tables.victory_members = [...STARTER_VICTORY_MEMBERS];
      }

      // Check authenticated admin session
      const userSaved = window.localStorage.getItem('pailippuram_admin_user');
      if (userSaved && userSaved !== 'null' && userSaved !== 'undefined') {
        try {
          const parsedUser = JSON.parse(userSaved);
          if (parsedUser && typeof parsedUser === 'object' && parsedUser.email) {
            this.currentUser = parsedUser;
          } else {
            this.currentUser = null;
          }
        } catch {
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
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
    const cat = categories.find((c) => String(c.id) === String(row.category_id));
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
    this.operation = 'select'; // 'select' | 'insert' | 'upsert' | 'update' | 'delete'
    this.payload = null;
    this.filters = [];
    this.sortCol = null;
    this.sortAsc = true;
    this.limitCount = null;
    this.offsetCount = 0;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.isHead = false;
    this.countMode = null;
    this.selectedFields = '*';
  }

  select(fields = '*', options = {}) {
    this.selectedFields = fields;
    if (options && options.count) {
      this.countMode = options.count;
    }
    if (options && options.head) {
      this.isHead = true;
    }
    // If not already in a mutation operation, default to select
    if (!this.operation || this.operation === 'select') {
      this.operation = 'select';
    }
    return this;
  }

  insert(rowOrRows, options = {}) {
    this.operation = 'insert';
    this.payload = rowOrRows;
    return this;
  }

  upsert(rowOrRows, options = {}) {
    this.operation = 'upsert';
    this.payload = rowOrRows;
    return this;
  }

  update(patch) {
    this.operation = 'update';
    this.payload = patch;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push((item) => {
      if (value === null || value === undefined) return item[column] === null || item[column] === undefined;
      return String(item[column]) === String(value);
    });
    return this;
  }

  neq(column, value) {
    this.filters.push((item) => String(item[column]) !== String(value));
    return this;
  }

  gt(column, value) {
    this.filters.push((item) => {
      const v = item[column];
      if (v == null) return false;
      return typeof v === 'number' ? v > Number(value) : String(v) > String(value);
    });
    return this;
  }

  gte(column, value) {
    this.filters.push((item) => {
      const v = item[column];
      if (v == null) return false;
      return typeof v === 'number' ? v >= Number(value) : String(v) >= String(value);
    });
    return this;
  }

  lt(column, value) {
    this.filters.push((item) => {
      const v = item[column];
      if (v == null) return false;
      if (typeof v === 'number') return v < Number(value);
      if (Date.parse(v) && Date.parse(value)) return new Date(v) < new Date(value);
      return String(v) < String(value);
    });
    return this;
  }

  lte(column, value) {
    this.filters.push((item) => {
      const v = item[column];
      if (v == null) return false;
      if (typeof v === 'number') return v <= Number(value);
      if (Date.parse(v) && Date.parse(value)) return new Date(v) <= new Date(value);
      return String(v) <= String(value);
    });
    return this;
  }

  like(column, pattern) {
    return this.ilike(column, pattern);
  }

  not(column, operator, value) {
    if (operator === 'eq') return this.neq(column, value);
    if (operator === 'is' && value === null) {
      this.filters.push((item) => item[column] != null);
      return this;
    }
    return this;
  }

  filter(column, operator, value) {
    if (operator === 'eq') return this.eq(column, value);
    if (operator === 'neq') return this.neq(column, value);
    if (operator === 'gt') return this.gt(column, value);
    if (operator === 'gte') return this.gte(column, value);
    if (operator === 'lt') return this.lt(column, value);
    if (operator === 'lte') return this.lte(column, value);
    if (operator === 'ilike') return this.ilike(column, value);
    return this;
  }

  returns() {
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

  in(column, values) {
    const valSet = new Set((values || []).map(String));
    this.filters.push((item) => valSet.has(String(item[column])));
    return this;
  }

  is(column, value) {
    if (value === null) {
      this.filters.push((item) => item[column] === null || item[column] === undefined);
    } else {
      this.filters.push((item) => item[column] === value);
    }
    return this;
  }

  match(object) {
    if (object && typeof object === 'object') {
      for (const [col, val] of Object.entries(object)) {
        this.eq(col, val);
      }
    }
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
    this.isMaybeSingle = true;
    return this;
  }

  async execute() {
    try {
      const table = this.store.getTable(this.tableName);

      if (this.operation === 'insert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
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

        const result = Array.isArray(this.payload) ? inserted : inserted[0];
        if (this.isSingle) {
          return { data: inserted[0] || null, error: null };
        }
        return { data: result, error: null };
      }

      if (this.operation === 'upsert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const upserted = [];
        for (const item of items) {
          let existingIdx = -1;
          if (item.id) {
            existingIdx = table.findIndex((r) => String(r.id) === String(item.id));
          }
          if (existingIdx >= 0) {
            table[existingIdx] = {
              ...table[existingIdx],
              ...item,
              updated_at: new Date().toISOString(),
            };
            upserted.push(table[existingIdx]);
          } else {
            const newRow = {
              ...item,
              id: item.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            table.unshift(newRow);
            upserted.push(newRow);
          }
        }
        this.store.saveToStorage();
        const result = Array.isArray(this.payload) ? upserted : upserted[0];
        if (this.isSingle) {
          return { data: upserted[0] || null, error: null };
        }
        return { data: result, error: null };
      }

      if (this.operation === 'update') {
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
              ...this.payload,
              updated_at: new Date().toISOString(),
            };
            updated.push(table[i]);
          }
        }
        this.store.saveToStorage();

        if (this.isSingle) {
          return { data: updated[0] || null, error: null, count: updated.length };
        }
        return { data: updated, error: null, count: updated.length };
      }

      if (this.operation === 'delete') {
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

        if (this.isSingle) {
          return { data: deleted[0] || null, error: null, count: deleted.length };
        }
        return { data: deleted, error: null, count: deleted.length };
      }

      // Default: 'select' operation
      const categories = this.store.getTable('categories');
      let list = table;
      if (this.tableName === 'listings') {
        list = table.map((item) => attachCategory(item, categories));
      }

      for (const filter of this.filters) {
        list = list.filter(filter);
      }

      const totalCount = list.length;

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
        if (!this.isMaybeSingle && list.length === 0) {
          return {
            data: null,
            error: { message: 'Row not found' },
            count: 0,
          };
        }
        return {
          data: list[0] || null,
          error: null,
          count: totalCount,
        };
      }

      return {
        data: list,
        error: null,
        count: totalCount,
      };
    } catch (err) {
      console.error('[MockQueryBuilder.execute error]', err);
      return { data: null, error: { message: err?.message || 'Database query error' } };
    }
  }

  // Thenable for await support
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.execute().catch(onRejected);
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
      async signInWithPassword({ email, password }) {
        const inputPass = String(password || '').trim();
        if (!inputPass) {
          return {
            data: { user: null },
            error: { message: 'Password is required to access the admin panel.' },
          };
        }

        let customPass = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          customPass = window.localStorage.getItem('pailippuram_admin_password');
        }

        const validPasswords = [
          customPass,
          'pailippuram2026',
          'Pailippuram@2026',
          'admin123',
          'admin',
          'pailippuram',
        ].filter(Boolean);

        const isMatch = validPasswords.includes(inputPass);
        if (!isMatch) {
          return {
            data: { user: null },
            error: { message: 'Incorrect password. Only authorized administrators with the password can access this panel.' },
          };
        }

        const userEmail = (email && String(email).trim()) || 'kl58u8090@gmail.com';
        memoryStore.currentUser = {
          id: 'admin-1',
          email: userEmail,
          role: 'admin',
          app_metadata: { role: 'admin' },
          user_metadata: { role: 'admin' },
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
