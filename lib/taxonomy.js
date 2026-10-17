// Master taxonomy for Nammude Pailippuram
// 5 Main Categories and their official subcategories with English & Malayalam names.

export const MAIN_CATEGORIES = [
  {
    id: 'contacts',
    kind: 'contact',
    href: '/contacts',
    label: 'Important Contacts',
    ml: 'പ്രധാന നമ്പറുകൾ',
    badge: '🚨 Emergency & Public Services',
    desc: 'Essential services, healthcare facilities, police, government offices & emergency helplines.',
    icon: '🚨',
    themeColor: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  {
    id: 'shops',
    kind: 'business',
    href: '/shops',
    label: 'Local Shops',
    ml: 'ലോക്കൽ കടകൾ & വ്യാപാരങ്ങൾ',
    badge: '🏪 Products & Retail',
    desc: 'Where people buy products or visit a physical business in Pailippuram.',
    icon: '🏪',
    themeColor: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  {
    id: 'workers',
    kind: 'worker',
    href: '/workers',
    label: 'Native Workers',
    ml: 'തൊഴിലാളികൾ & വിദഗ്ദ്ധർ',
    badge: '🛠️ Skilled Services for Hire',
    desc: 'People whom residents hire to perform skilled trade, repair, maintenance, or personal services.',
    icon: '🛠️',
    themeColor: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  {
    id: 'transport',
    kind: 'transport',
    href: '/transport',
    label: 'Transportation Services',
    ml: 'വാഹനങ്ങൾ & ഗതാഗതം',
    badge: '🚗 Passenger & Goods Transport',
    desc: 'People and businesses providing transport: autos, taxis, pickup goods, JCB & vehicle services.',
    icon: '🚗',
    themeColor: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
  {
    id: 'panchayath',
    kind: 'panchayath',
    href: '/panchayath',
    label: 'Panchayat',
    ml: 'ഗ്രാമപഞ്ചായത്ത്',
    badge: '🏛️ Local Government & Civic',
    desc: 'Official local-government information, public services, certificates, and civic facilities.',
    icon: '🏛️',
    themeColor: '#1e40af',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
];

// Subcategories structured by Main Category and Group
export const TAXONOMY = {
  // 1. Important Contacts 🚨
  contacts: {
    title: 'Important Contacts',
    ml: 'പ്രധാന നമ്പറുകൾ',
    kind: 'contact',
    subcategories: [
      { name: 'Police Station', ml: 'പോലീസ് സ്റ്റേഷൻ', icon: '👮' },
      { name: 'Fire & Rescue Services', ml: 'ഫയർ & റെസ്ക്യൂ സർവീസ്', icon: '🚒' },
      { name: 'Ambulance Services', ml: 'ആംബുലൻസ് സർവീസ്', icon: '🚑' },
      { name: 'Government Hospital / PHC', ml: 'സർക്കാർ ആശുപത്രി / പി.എച്ച്.സി', icon: '🏥' },
      { name: 'Private Hospitals & Clinics', ml: 'സ്വകാര്യ ആശുപത്രികൾ & ക്ലിനിക്കുകൾ', icon: '🩺' },
      { name: 'Pharmacies', ml: 'ഫാർമസികൾ / മരുന്നുകടകൾ', icon: '💊' },
      { name: 'Blood Banks', ml: 'ബ്ലഡ് ബാങ്കുകൾ', icon: '🩸' },
      { name: 'Veterinary Hospital', ml: 'മൃഗാശുപത്രി', icon: '🐾' },
      { name: 'Women’s Helpline', ml: 'വനിതാ ഹെൽപ്പ്‌ലൈൻ (1091)', icon: '👩' },
      { name: 'Child Helpline', ml: 'ചൈൽഡ് ലൈൻ (1098)', icon: '🧒' },
      { name: 'Electricity Complaints (KSEB)', ml: 'കെ.എസ്.ഇ.ബി ഇലക്ട്രിസിറ്റി പരാതികൾ', icon: '⚡' },
      { name: 'Water Supply Complaints', ml: 'കുടിവെള്ള വിതരണ പരാതികൾ', icon: '💧' },
      { name: 'Gas Agency', ml: 'ഗ്യാസ് ഏജൻസി', icon: '🔥' },
      { name: 'Post Office', ml: 'പോസ്റ്റ് ഓഫീസ്', icon: '📮' },
      { name: 'Banks & ATMs', ml: 'ബാങ്കുകൾ & എ.ടി.എം', icon: '🏦' },
      { name: 'Akshaya Centre', ml: 'അക്ഷയ കേന്ദ്രം', icon: '💻' },
      { name: 'Ration Shop', ml: 'റേഷൻ കട', icon: '🌾' },
      { name: 'Disaster Management', ml: 'ദുരന്ത നിവാരണം', icon: '⚠️' },
      { name: 'Emergency Roadside Assistance', ml: 'എമർജൻസി റോഡ്‌സൈഡ് സഹായം', icon: '🛟' },
    ],
  },

  // 2. Local Shops 🏪
  shops: {
    title: 'Local Shops',
    ml: 'കടകൾ & വ്യാപാരങ്ങൾ',
    kind: 'business',
    groups: [
      {
        name: 'Food & Groceries',
        ml: 'ഭക്ഷണം & പലചരക്ക്',
        subcategories: [
          { name: 'Hotels & Restaurants', ml: 'ഹോട്ടലുകൾ & റസ്റ്റോറന്റുകൾ', icon: '🍲' },
          { name: 'Bakeries', ml: 'ബേക്കറികൾ', icon: '🍞' },
          { name: 'Tea Shops', ml: 'ചായക്കടകൾ', icon: '☕' },
          { name: 'Juice Shops', ml: 'ജ്യൂസ് ബാറുകൾ & കൂൾബാർ', icon: '🥤' },
          { name: 'Grocery Stores', ml: 'പലചരക്ക് കടകൾ', icon: '🛒' },
          { name: 'Supermarkets', ml: 'സൂപ്പർമാർക്കറ്റുകൾ', icon: '🏬' },
          { name: 'Vegetable & Fruit Shops', ml: 'പച്ചക്കറി & പഴക്കടകൾ', icon: '🥬' },
          { name: 'Chicken & Meat Stalls', ml: 'ഇറച്ചി & കോഴിക്കടകൾ', icon: '🍗' },
          { name: 'Fish Shops', ml: 'മത്സ്യ സ്റ്റാളുകൾ', icon: '🐟' },
          { name: 'Catering Services', ml: 'കാറ്ററിംഗ് സർവീസുകൾ', icon: '🍽️' },
          { name: 'Water Suppliers', ml: 'കുടിവെള്ള വിതരണക്കാർ', icon: '🚰' },
        ],
      },
      {
        name: 'Home & Construction',
        ml: 'നിർമ്മാണം & വീട്ടുസാധനങ്ങൾ',
        subcategories: [
          { name: 'Hardware Shops', ml: 'ഹാർഡ്‌വെയർ കടകൾ', icon: '🔩' },
          { name: 'Paint Shops', ml: 'പെയിന്റ് ഷോപ്പുകൾ', icon: '🎨' },
          { name: 'Furniture Shops', ml: 'ഫർണിച്ചർ കടകൾ', icon: '🪑' },
          { name: 'Flooring & Tile Shops', ml: 'ടൈൽ & ഫ്ലോറിംഗ് കടകൾ', icon: '🧱' },
          { name: 'Flour Mills', ml: 'മില്ലുകൾ (പൊടിക്കുന്നത്)', icon: '⚙️' },
          { name: 'Electrical Shops', ml: 'ഇലക്ട്രിക്കൽ കടകൾ', icon: '💡' },
          { name: 'Plumbing & Sanitary Shops', ml: 'പ്ലംബിംഗ് & സാനിറ്ററി കടകൾ', icon: '🚿' },
          { name: 'Cement & Building Materials', ml: 'സിമന്റ് & നിർമ്മാണ സാമഗ്രികൾ', icon: '🏗️' },
          { name: 'Aluminium & Glass Shops', ml: 'അലുമിനിയം & ഗ്ലാസ്സ് കടകൾ', icon: '🪟' },
          { name: 'Home Appliance Shops', ml: 'ഹോം അപ്ലയൻസസ് ഷോപ്പുകൾ', icon: '📺' },
        ],
      },
      {
        name: 'Personal Shopping',
        ml: 'വ്യക്തിഗത ഷോപ്പിംഗ്',
        subcategories: [
          { name: 'Mobile Shops', ml: 'മൊബൈൽ ഫോൺ ഷോപ്പുകൾ', icon: '📱' },
          { name: 'Computer & Electronics Shops', ml: 'കമ്പ്യൂട്ടർ & ഇലക്ട്രോണിക്സ്', icon: '💻' },
          { name: 'Bookshops & Stationery', ml: 'പുസ്തകക്കടകൾ & സ്റ്റേഷനറി', icon: '📚' },
          { name: 'Fancy & Gift Shops', ml: 'ഫാൻസി & ഗിഫ്റ്റ് കടകൾ', icon: '🎁' },
          { name: 'Textile & Clothing Shops', ml: 'ടെക്സ്റ്റൈൽസ് & വസ്ത്രക്കടകൾ', icon: '👗' },
          { name: 'Footwear Shops', ml: 'പാദരക്ഷാ കടകൾ (ചെരിപ്പുകട)', icon: '👞' },
          { name: 'Jewellery Shops', ml: 'ജ്വല്ലറികൾ', icon: '💍' },
          { name: 'Cosmetics Shops', ml: 'സൗന്ദര്യവർദ്ധക സാമഗ്രികൾ', icon: '💄' },
          { name: 'Optical Shops', ml: 'ഒപ്റ്റിക്കൽസ് (കണ്ണടക്കടകൾ)', icon: '👓' },
          { name: 'Sports Shops', ml: 'സ്പോർട്സ് ഗുഡ്സ് കടകൾ', icon: '🏏' },
          { name: 'Agricultural Supply Shops', ml: 'കാർഷിക വളം & വിത്ത് കടകൾ', icon: '🌱' },
        ],
      },
      {
        name: 'Automotive',
        ml: 'വാഹന അനുബന്ധ കടകൾ',
        subcategories: [
          { name: 'Spare Parts Shops', ml: 'സ്പെയർ പാർട്സ് കടകൾ', icon: '⚙️' },
          { name: 'Tyre Shops', ml: 'ടയർ ഷോപ്പുകൾ', icon: '🛞' },
          { name: 'Battery Shops', ml: 'ബാറ്ററി കടകൾ', icon: '🔋' },
          { name: 'Vehicle Accessories Shops', ml: 'വാഹന അലങ്കാര കടകൾ', icon: '🚗' },
          { name: 'Petrol Pumps', ml: 'പെട്രോൾ പമ്പുകൾ', icon: '⛽' },
          { name: 'Engine Oil Shops', ml: 'എഞ്ചിൻ ഓയിൽ കടകൾ', icon: '🛢️' },
        ],
      },
      {
        name: 'Other Businesses',
        ml: 'മറ്റു വ്യാപാരങ്ങൾ',
        subcategories: [
          { name: 'Photo & Video Studios', ml: 'ഫോട്ടോ & വീഡിയോ സ്റ്റുഡിയോ', icon: '📸' },
          { name: 'Printing & Photocopy Centres', ml: 'പ്രിന്റിംഗ് & ഡി.ടി.പി സെന്ററുകൾ', icon: '🖨️' },
          { name: 'Flex Printing', ml: 'ഫ്ലെക്സ് പ്രിന്റിംഗ്', icon: '🖼️' },
          { name: 'Courier Services', ml: 'കൊറിയർ സർവീസുകൾ', icon: '📦' },
          { name: 'Internet & Computer Centres', ml: 'ഇന്റർനെറ്റ് കഫേ & സർവീസ് സെന്റർ', icon: '🌐' },
          { name: 'Event Decoration & Rental Shops', ml: 'ഡെക്കറേഷൻ & റെന്റൽ കടകൾ', icon: '🎪' },
          { name: 'Medical Equipment Shops', ml: 'മെഡിക്കൽ എക്യുപ്മെന്റ് കടകൾ', icon: '🩺' },
          { name: 'Pet Supplies & Animal Feed', ml: 'വളർത്തുമൃഗ തീറ്റ & സാധനങ്ങൾ', icon: '🐕' },
        ],
      },
    ],
  },

  // 3. Native Workers 🛠️
  workers: {
    title: 'Native Workers',
    ml: 'തൊഴിലാളികൾ & സേവനദാതാക്കൾ',
    kind: 'worker',
    groups: [
      {
        name: 'Home & Construction',
        ml: 'നിർമ്മാണം & അറ്റകുറ്റപ്പണി',
        subcategories: [
          { name: 'Electricians', ml: 'ഇലക്ട്രീഷ്യന്മാർ', icon: '⚡' },
          { name: 'Plumbers', ml: 'പ്ലംബർമാർ', icon: '🔧' },
          { name: 'Carpenters', ml: 'ആശാരിമാർ (തച്ചന്മാർ)', icon: '🪚' },
          { name: 'Painters', ml: 'പെയിന്റർമാർ', icon: '🎨' },
          { name: 'Welders', ml: 'വെൽഡർമാർ & ഫാബ്രിക്കേറ്റർമാർ', icon: '👨‍🏭' },
          { name: 'Masons', ml: 'മേസൺമാർ (കെട്ടിട നിർമ്മാണം)', icon: '🧱' },
          { name: 'Tile Workers', ml: 'ടൈൽ & മാർബിൾ തൊഴിലാളികൾ', icon: '🪟' },
          { name: 'Roof Workers', ml: 'റൂഫിംഗ് തൊഴിലാളികൾ', icon: '🏠' },
          { name: 'Aluminium Fabricators', ml: 'അലുമിനിയം ഫാബ്രിക്കേറ്റർമാർ', icon: '🚪' },
          { name: 'Glass Workers', ml: 'ഗ്ലാസ്സ് വർക്കേഴ്സ്', icon: '🪞' },
          { name: 'Building Contractors', ml: 'കെട്ടിട നിർമ്മാണ കരാറുകാർ', icon: '👷' },
          { name: 'Interior Designers', ml: 'ഇന്റീരിയർ ഡിസൈനർമാർ', icon: '🛋️' },
          { name: 'CCTV Installers', ml: 'സി.സി.ടി.വി ഇൻസ്റ്റാളേഷൻ', icon: '📹' },
        ],
      },
      {
        name: 'Repair & Maintenance',
        ml: 'റിപ്പയറിംഗ് & സർവീസിംഗ്',
        subcategories: [
          { name: 'Car Mechanics', ml: 'കാർ മെക്കാനിക്കുകൾ', icon: '🚗' },
          { name: 'Bike Mechanics', ml: 'ബൈക്ക് മെക്കാനിക്കുകൾ', icon: '🏍️' },
          { name: 'Auto Electricians', ml: 'ഓട്ടോ ഇലക്ട്രീഷ്യന്മാർ', icon: '🔌' },
          { name: 'Vehicle Painters', ml: 'വാഹന പെയിന്റിംഗ് വിദഗ്ദ്ധർ', icon: '🖌️' },
          { name: 'Denting & Bodywork Workers', ml: 'ഡെന്റിംഗ് & ടിങ്കറിംഗ് പണിക്കാർ', icon: '🔨' },
          { name: 'Puncture Repair Workers', ml: 'പഞ്ചർ ഒട്ടിക്കുന്ന തൊഴിലാളികൾ', icon: '🛞' },
          { name: 'AC & Refrigerator Technicians', ml: 'എ.സി & ഫ്രിഡ്ജ് ടെക്നീഷ്യന്മാർ', icon: '❄️' },
          { name: 'Electrical Appliance Repairers', ml: 'വീട്ടുപകരണ റിപ്പയർ ചെയ്യുന്നവർ', icon: '📻' },
          { name: 'Water Purifier Technicians', ml: 'വാട്ടർ പ്യൂരിഫയർ സർവീസ്', icon: '💧' },
          { name: 'Mobile Repair Technicians', ml: 'മൊബൈൽ ഫോൺ സർവീസ് വിദഗ്ദ്ധർ', icon: '📱' },
          { name: 'Computer Repair Technicians', ml: 'കമ്പ്യൂട്ടർ സർവീസ് ടെക്നീഷ്യന്മാർ', icon: '🖥️' },
        ],
      },
      {
        name: 'Personal Services',
        ml: 'വ്യക്തിഗത സേവനങ്ങൾ',
        subcategories: [
          { name: 'Tailors', ml: 'തയ്യൽക്കാർ', icon: '🧵' },
          { name: 'Barbers', ml: 'ബാർബർമാർ (ക്ഷുരകന്മാർ)', icon: '✂️' },
          { name: 'Beauticians', ml: 'ബ്യൂട്ടീഷ്യന്മാർ', icon: '💅' },
          { name: 'Makeup Artists', ml: 'മേക്കപ്പ് ആർട്ടിസ്റ്റുകൾ', icon: '💄' },
          { name: 'Mehndi Artists', ml: 'മൈലാഞ്ചി ആർട്ടിസ്റ്റുകൾ', icon: '🌿' },
          { name: 'Photographers', ml: 'ഫോട്ടോഗ്രാഫർമാർ', icon: '📷' },
          { name: 'Videographers', ml: 'വീഡിയോഗ്രാഫർമാർ', icon: '🎥' },
          { name: 'Graphic Designers', ml: 'ഗ്രാഫിക് ഡിസൈനർമാർ', icon: '💻' },
          { name: 'Video Editors', ml: 'വീഡിയോ എഡിറ്റർമാർ', icon: '🎬' },
          { name: 'Event Decorators', ml: 'സ്റ്റേജ് & ഇവന്റ് ഡെക്കറേറ്റർമാർ', icon: '💐' },
        ],
      },
      {
        name: 'Education & Professional Services',
        ml: 'വിദ്യാഭ്യാസം & പ്രൊഫഷണൽ സേവനങ്ങൾ',
        subcategories: [
          { name: 'Home Tutors', ml: 'ഹോം ട്യൂഷൻ അധ്യാപകർ', icon: '📖' },
          { name: 'Tuition Teachers', ml: 'ട്യൂഷൻ ടീച്ചർമാർ', icon: '🧑‍🏫' },
          { name: 'Music Teachers', ml: 'സംഗീതാധ്യാപകർ', icon: '🎵' },
          { name: 'Dance Teachers', ml: 'നൃത്താധ്യാപകർ', icon: '💃' },
          { name: 'Fitness Trainers', ml: 'ഫിറ്റ്നസ് ട്രെയിനർമാർ', icon: '🏋️' },
          { name: 'Computer Trainers', ml: 'കമ്പ്യൂട്ടർ അധ്യാപകർ', icon: '💻' },
          { name: 'Driving Instructors', ml: 'ഡ്രൈവിംഗ് പരിശീലകർ', icon: '🚘' },
          { name: 'Freelancers & IT Service Providers', ml: 'ഐ.ടി & ഫ്രീലാൻസർമാർ', icon: '🌐' },
        ],
      },
      {
        name: 'Other Services',
        ml: 'മറ്റു തൊഴിൽ സേവനങ്ങൾ',
        subcategories: [
          { name: 'Daily-Wage Labourers', ml: 'ദിവസവേതന തൊഴിലാളികൾ', icon: '💪' },
          { name: 'Cleaners', ml: 'ക്ലീനിംഗ് തൊഴിലാളികൾ', icon: '🧹' },
          { name: 'Housekeeping Workers', ml: 'ഹൗസ് കീപ്പിംഗ് തൊഴിലാളികൾ', icon: '🧺' },
          { name: 'Gardeners', ml: 'തോട്ടപ്പണിക്കാർ / മരംവെട്ട്', icon: '🌳' },
          { name: 'Pest-Control Workers', ml: 'കീട നിയന്ത്രണ തൊഴിലാളികൾ', icon: '🐜' },
          { name: 'Packers & Movers', ml: 'പാക്കേഴ്സ് & മൂവേഴ്സ്', icon: '📦' },
          { name: 'Excavator / JCB Operators', ml: 'ജെ.സി.ബി / എക്സ്കവേറ്റർ ഓപ്പറേറ്റർമാർ', icon: '🚜' },
          { name: 'Delivery Workers', ml: 'ഡെലിവറി തൊഴിലാളികൾ', icon: '🛵' },
        ],
      },
    ],
  },

  // 4. Transportation Services 🚗
  transport: {
    title: 'Transportation Services',
    ml: 'വാഹനങ്ങൾ & ഗതാഗത സേവനങ്ങൾ',
    kind: 'transport',
    subcategories: [
      { name: 'Auto-Rickshaw Drivers', ml: 'ഓട്ടോറിക്ഷ ഡ്രൈവർമാർ', icon: '🛺' },
      { name: 'Taxi & Cab Services', ml: 'ടാക്സി & കാർ സർവീസുകൾ', icon: '🚕' },
      { name: 'Car Rental Services', ml: 'റെന്റൽ കാറുകൾ (വാടകയ്ക്ക്)', icon: '🚘' },
      { name: 'Goods Auto Services', ml: 'ഗുഡ്സ് ഓട്ടോ സർവീസ്', icon: '🛺' },
      { name: 'Mini-Truck Services', ml: 'മിനി ട്രക്ക് & പിക്കപ്പ് സർവീസ്', icon: '🛻' },
      { name: 'Lorry & Goods Transport', ml: 'ലോറി & ഭാരവാഹന ഗതാഗതം', icon: '🚛' },
      { name: 'Private Bus Operators', ml: 'സ്വകാര്യ ബസ് ഓപ്പറേറ്റർമാർ', icon: '🚌' },
      { name: 'Bus Routes & Timings', ml: 'ബസ് റൂട്ടുകൾ & സമയങ്ങൾ', icon: '⏰', link: '/bus' },
      { name: 'School & College Transport', ml: 'സ്കൂൾ / കോളേജ് വാഹനങ്ങൾ', icon: '🚐' },
      { name: 'Tourist Vehicle Services', ml: 'ടൂറിസ്റ്റ് വാൻ & ട്രാവലർ', icon: '🚐' },
      { name: 'Ambulance Transport', ml: 'ആംബുലൻസ് സർവീസുകൾ', icon: '🚑' },
      { name: 'Driving Schools', ml: 'ഡ്രൈവിംഗ് സ്കൂളുകൾ', icon: '🚦' },
      { name: 'Vehicle Towing Services', ml: 'വാഹന റിക്കവറി & ടോവിങ്', icon: '🪝' },
      { name: 'Roadside Breakdown Assistance', ml: 'ബ്രേക്ക്ഡൗൺ സഹായം', icon: '🛟' },
      { name: 'Petrol Pumps', ml: 'പെട്രോൾ പമ്പുകൾ', icon: '⛽' },
      { name: 'EV Charging Stations', ml: 'ഇ.വി ചാർജ്ജിംഗ് സ്റ്റേഷനുകൾ', icon: '🔌' },
      { name: 'Railway Station Information', ml: 'റെയിൽവേ സ്റ്റേഷൻ വിവരങ്ങൾ', icon: '🚆' },
      { name: 'Courier & Parcel Transport', ml: 'പാഴ്സൽ & കൊറിയർ ഗതാഗതം', icon: '📦' },
    ],
  },

  // 5. Panchayat 🏛️
  panchayath: {
    title: 'Panchayat',
    ml: 'ഗ്രാമപഞ്ചായത്ത് വിവരങ്ങൾ & സേവനങ്ങൾ',
    kind: 'panchayath',
    groups: [
      {
        name: 'Representatives & Offices',
        ml: 'ജനപ്രതിനിധികളും ഓഫീസും',
        sectionKey: 'bearer',
        subcategories: [
          { name: 'Panchayat Office', ml: 'പഞ്ചായത്ത് ഓഫീസ്', icon: '🏛️' },
          { name: 'Panchayat President', ml: 'പഞ്ചായത്ത് പ്രസിഡന്റ്', icon: '👤' },
          { name: 'Vice-President', ml: 'വൈസ് പ്രസിഡന്റ്', icon: '👤' },
          { name: 'Ward Members', ml: 'വാർഡ് മെമ്പർമാർ', icon: '👥' },
          { name: 'Block Panchayat Representatives', ml: 'ബ്ലോക്ക് പഞ്ചായത്ത് അംഗങ്ങൾ', icon: '🏛️' },
          { name: 'District Panchayat Representatives', ml: 'ജില്ലാ പഞ്ചായത്ത് അംഗങ്ങൾ', icon: '🏛️' },
          { name: 'Panchayat Secretary', ml: 'പഞ്ചായത്ത് സെക്രട്ടറി', icon: '💼' },
          { name: 'Front Office / Citizen Service Desk', ml: 'ഫ്രണ്ട് ഓഫീസ് / സിറ്റിസൻ ഡെസ്ക്', icon: '🤝' },
        ],
      },
      {
        name: 'Certificates & Government Services',
        ml: 'സർട്ടിഫിക്കറ്റുകളും സേവനങ്ങളും',
        sectionKey: 'service',
        subcategories: [
          { name: 'Birth & Death Certificates', ml: 'ജനന-മരണ സർട്ടിഫിക്കറ്റുകൾ', icon: '📜' },
          { name: 'Marriage Registration', ml: 'വിവാഹ രജിസ്ട്രേഷൻ', icon: '💍' },
          { name: 'Building Permits', ml: 'കെട്ടിട നിർമ്മാണ പെർമിറ്റ്', icon: '🏢' },
          { name: 'Property Tax Services', ml: 'വസ്തു നികുതി ഒടുക്കൽ', icon: '🪙' },
          { name: 'Welfare Pensions', ml: 'ക്ഷേമ പെൻഷനുകൾ', icon: '👴' },
          { name: 'Social Welfare Schemes', ml: 'സാമൂഹ്യക്ഷേമ പദ്ധതികൾ', icon: '🤝' },
          { name: 'MGNREGS Services', ml: 'തൊഴിലുറപ്പ് പദ്ധതി', icon: '⛏️' },
          { name: 'Kudumbashree', ml: 'കുടുംബശ്രീ', icon: '👩‍👩‍👧‍👦' },
          { name: 'Ration Card Services', ml: 'റേഷൻ കാർഡ് സേവനങ്ങൾ', icon: '🌾' },
          { name: 'Public Grievances & Complaints', ml: 'പരാതി പരിഹാര സെൽ', icon: '📮' },
        ],
      },
      {
        name: 'Public Facilities',
        ml: 'പൊതു സൗകര്യങ്ങൾ',
        sectionKey: 'facility',
        subcategories: [
          { name: 'Anganwadis', ml: 'അങ്കണവാടികൾ', icon: '🧒' },
          { name: 'Government Schools', ml: 'സർക്കാർ വിദ്യാലയങ്ങൾ', icon: '🏫' },
          { name: 'Government Libraries', ml: 'ഗ്രന്ഥശാലകൾ / വായനശാലകൾ', icon: '📚' },
          { name: 'Community Halls', ml: 'കമ്മ്യൂണിറ്റി ഹാളുകൾ', icon: '🎪' },
          { name: 'Public Drinking Water', ml: 'പൊതു കുടിവെള്ള വിതരണം', icon: '🚰' },
          { name: 'Waste Collection', ml: 'മാലിന്യ ശേഖരണം', icon: '♻️' },
          { name: 'Haritha Karma Sena', ml: 'ഹരിത കർമ്മ സേന', icon: '🌱' },
          { name: 'Streetlight Complaints', ml: 'തെരുവുവിളക്ക് പരാതികൾ', icon: '💡' },
          { name: 'Road Maintenance Complaints', ml: 'റോഡ് അറ്റകുറ്റപ്പണി പരാതികൾ', icon: '🛣️' },
          { name: 'Public Health & Sanitation', ml: 'പൊതുജനാരോഗ്യം & ശുചിത്വം', icon: '🩺' },
        ],
      },
      {
        name: 'Local Information',
        ml: 'പ്രാദേശിക വിവരങ്ങൾ & അറിയിപ്പുകൾ',
        sectionKey: 'notice',
        subcategories: [
          { name: 'Public Notices', ml: 'പൊതു അറിയിപ്പുകൾ', icon: '📢' },
          { name: 'Ward Development Projects', ml: 'വാർഡ് വികസന പദ്ധതികൾ', icon: '📋' },
          { name: 'Panchayat Meeting Announcements', ml: 'ഗ്രാമപഞ്ചായത്ത് യോഗ അറിയിപ്പുകൾ', icon: '👥' },
          { name: 'Government Schemes', ml: 'സർക്കാർ ആനുകൂല്യ പദ്ധതികൾ', icon: '🎁' },
          { name: 'Local Events', ml: 'പ്രാദേശിക പരിപാടികൾ', icon: '🎪' },
          { name: 'Development Projects & Updates', ml: 'വികസന പ്രവർത്തനങ്ങൾ & അപ്‌ഡേറ്റുകൾ', icon: '🏗️' },
        ],
      },
    ],
  },
};

// Helper: Flatten all subcategories for a given kind/section
export function getAllSubcategories(sectionKey) {
  const section = TAXONOMY[sectionKey];
  if (!section) return [];
  if (section.subcategories) return section.subcategories;
  if (section.groups) {
    return section.groups.flatMap((g) => g.subcategories.map((sub) => ({ ...sub, group: g.name, groupMl: g.ml })));
  }
  return [];
}

// Determines if a listing belongs to a category / subcategory
export function matchListingToCategory(item, cat) {
  if (!item || !cat) return false;

  // Direct category_id match
  if (cat.id != null && item.category_id != null && String(item.category_id) === String(cat.id)) {
    return true;
  }

  const catName = (cat.name || '').toLowerCase().trim();
  const catMl = (cat.ml || cat.name_ml || '').trim();

  // Joined category relation match
  const joinedName = (item.categories?.name || '').toLowerCase().trim();
  if (catName && joinedName && (joinedName === catName || joinedName.includes(catName) || catName.includes(joinedName))) {
    return true;
  }

  // Text search in title and description
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || item.detail || '').toLowerCase();
  const area = (item.area || '').toLowerCase();

  if (catName) {
    // Exact or substring match on keywords (avoid short word false positives)
    const cleanWord = catName.replace(/[^\w\s]/g, '').trim();
    if (cleanWord.length >= 3 && (title.includes(cleanWord) || desc.includes(cleanWord) || area.includes(cleanWord))) {
      return true;
    }
  }

  if (catMl && (item.title?.includes(catMl) || item.description?.includes(catMl) || item.detail?.includes(catMl))) {
    return true;
  }

  return false;
}

// "only show categories with atleast one to show":
// Given a list of category candidates and all listings of a section,
// return ONLY the categories that have at least one matching item.
export function filterCategoriesWithListings(categories = [], listings = []) {
  if (!categories || categories.length === 0 || !listings || listings.length === 0) {
    return [];
  }

  return categories
    .map((cat) => {
      const matchCount = listings.filter((item) => matchListingToCategory(item, cat)).length;
      return {
        ...cat,
        count: matchCount,
      };
    })
    .filter((cat) => cat.count > 0);
}

