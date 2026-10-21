'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import MultiPhoneInput from '../../components/MultiPhoneInput';
import { sendSubmission } from '../../lib/submit';
import { BLOOD_GROUPS } from '../../lib/sections';

const MENUS = [
  {
    type: 'transport',
    label: 'Taxi, Auto, JCB',
    ml: 'വാഹനങ്ങൾ / ടാക്സി',
    icon: '🚖',
    backHref: '/transport',
    backLabel: 'Transportation',
    desc: 'Register auto rickshaw, taxi car, JCB, tipper, pickup goods or ambulance.',
    chipsTitle: 'Vehicle Type / വാഹന ഇനം',
    chips: [
      { id: 'Auto Rickshaw · ഓട്ടോറിക്ഷ', label: '🛺 Auto Rickshaw (ഓട്ടോ)' },
      { id: 'Taxi / Cab · ടാക്സി കാർ', label: '🚕 Taxi / Car (ടാക്സി)' },
      { id: 'JCB / Earthmover · ജെ.സി.ബി', label: '🚜 JCB / Earthmover' },
      { id: 'Tipper Truck · ടിപ്പർ ലോറി', label: '🚛 Tipper Truck' },
      { id: 'Pickup Goods · പിക്കപ്പ് ഗുഡ്സ്', label: '🛻 Pickup / Goods' },
      { id: 'Tourist Van / Traveler · ട്രാവലർ', label: '🚐 Traveler / Van' },
      { id: 'Ambulance · ആംബുലൻസ്', label: '🚑 Ambulance' },
      { id: 'Other Vehicle · മറ്റു വാഹനം', label: '⚙️ Other Vehicle' },
    ],
    nameLabel: 'Driver or Service Name / പേര്',
    namePlaceholder: 'Driver or vehicle name',
    areaLabel: 'Stand / Location / സ്റ്റാൻഡ്',
    areaPlaceholder: 'Stand or location',
  },
  {
    type: 'business',
    label: 'Local Shop',
    ml: 'കടകൾ / വ്യാപാര സ്ഥാപനം',
    icon: '🏪',
    backHref: '/shops',
    backLabel: 'Local Shops',
    desc: 'List your shop, supermarket, bakery, pharmacy, or service center around Pailippuram.',
    chipsTitle: 'Shop Category / കടയുടെ വിഭാഗം',
    chips: [
      { id: 'Grocery / Supermarket · പലചരക്ക്', label: '🛒 Grocery / Supermarket' },
      { id: 'Medical / Pharmacy · മരുന്നുകട', label: '💊 Medical / Pharmacy' },
      { id: 'Bakery & Coolbar · ബേക്കറി', label: '🍞 Bakery & Coolbar' },
      { id: 'Hotel / Restaurant · ഹോട്ടൽ', label: '🍲 Hotel & Restaurant' },
      { id: 'Vegetables & Fruits · പച്ചക്കറി', label: '🥬 Vegetables & Fruits' },
      { id: 'Meat & Fish · ഇറച്ചി / മീൻ', label: '🥩 Meat & Fish Stall' },
      { id: 'Electrical & Hardware · ഹാർഡ്‌വെയർ', label: '🔌 Electrical & Hardware' },
      { id: 'Textiles & Tailoring · തുണിക്കട', label: '🧵 Textiles & Tailoring' },
      { id: 'Mobile & Electronics · മൊബൈൽ', label: '📱 Mobile & Electronics' },
      { id: 'Stationery & Books · സ്റ്റേഷനറി', label: '📚 Stationery & Books' },
      { id: 'Automobile & Workshop · വർക്ക്‌ഷോപ്പ്', label: '🛠️ Workshop / Garage' },
      { id: 'Other Shop · മറ്റ് കടകൾ', label: '🏪 Other Shop / Service' },
    ],
    nameLabel: 'Shop Name / കടയുടെ പേര്',
    namePlaceholder: 'Shop or business name',
    areaLabel: 'Place / Landmark in Pailippuram / സ്ഥലം',
    areaPlaceholder: 'Area or landmark',
  },
  {
    type: 'worker',
    label: 'Native Worker',
    ml: 'തൊഴിലാളികൾ / സേവനങ്ങൾ',
    icon: '👷',
    backHref: '/workers',
    backLabel: 'Native Workers',
    desc: 'Register as a skilled worker, technician or craftsman available in Pailippuram.',
    chipsTitle: 'Trade / Skill / ജോലി വിഭാഗം',
    chips: [
      { id: 'Plumber · പ്ലംബർ', label: '🔧 Plumber (പ്ലംബർ)' },
      { id: 'Electrician · ഇലക്ട്രീഷ്യൻ', label: '⚡ Electrician (ഇലക്ട്രീഷ്യൻ)' },
      { id: 'Painter · പെയിന്റർ', label: '🎨 Painter (പെയിന്റർ)' },
      { id: 'Carpenter · ആശാരി', label: '🪚 Carpenter (ആശാരി)' },
      { id: 'Mason · മേസൺ / പണിക്കാരൻ', label: '🧱 Mason / Brickwork' },
      { id: 'Tile Worker · ടൈൽ പണി', label: '🪟 Tile / Marble' },
      { id: 'Coconut Climber · തെങ്ങ് കയറ്റം', label: '🌴 Coconut Climber' },
      { id: 'Welding · വെൽഡിംഗ്', label: '👨‍🏭 Welding / Fabrication' },
      { id: 'AC & Appliance Tech · എസി സർവീസ്', label: '❄️ AC & Appliance Tech' },
      { id: 'Concrete Worker · വാർക്കപ്പണി', label: '🔨 Concrete / Slab' },
      { id: 'Gardening & Landscaping · തോട്ടം', label: '🌿 Gardening / Tree Cutter' },
      { id: 'General Labour · കൂലിപ്പണി', label: '💪 General Labour' },
    ],
    nameLabel: 'Worker or Team Name / പേര്',
    namePlaceholder: 'Worker or technician name',
    areaLabel: 'Area / Ward in Pailippuram / സ്ഥലം',
    areaPlaceholder: 'Area or ward',
  },
  {
    type: 'donor',
    label: 'Blood Donor',
    ml: 'രക്തദാതാവ്',
    icon: '🩸',
    backHref: '/donors',
    backLabel: 'Blood Donors',
    desc: 'Register as a voluntary blood donor to help people in emergencies.',
    chipsTitle: 'Select Blood Group / രക്തഗ്രൂപ്പ് തിരഞ്ഞെടുക്കുക',
    chips: BLOOD_GROUPS.map((g) => ({ id: g, label: g })),
    nameLabel: 'Donor Full Name / രക്തദാതാവിന്റെ പേര്',
    namePlaceholder: 'Full name',
    areaLabel: 'Area / Ward in Pailippuram / സ്ഥലം',
    areaPlaceholder: 'Area or ward',
  },
  {
    type: 'contact',
    label: 'Important Contact',
    ml: 'പ്രധാന നമ്പറുകൾ',
    icon: '📞',
    backHref: '/contacts',
    backLabel: 'Important Contacts',
    desc: 'Essential public service, hospital, government office, or emergency helpline.',
    chipsTitle: 'Department / വിഭാഗം',
    chips: [
      { id: 'Hospital / Clinic · ആശുപത്രി / ക്ലിനിക്ക്', label: '🏥 Hospital / Clinic' },
      { id: 'Police Station · പോലീസ്', label: '👮 Police Station' },
      { id: 'Fire Force · ഫയർ ഫോഴ്സ്', label: '🚒 Fire Force' },
      { id: 'KSEB / Electricity · വൈദ്യുതി', label: '⚡ KSEB / Electrical' },
      { id: 'Village Office · വില്ലേജ് ഓഫീസ്', label: '🏛️ Village Office' },
      { id: 'Panchayath Office · പഞ്ചായത്ത്', label: '🏢 Panchayath Office' },
      { id: 'Akshaya Centre · അക്ഷയ കേന്ദ്രം', label: '💻 Akshaya Centre' },
      { id: 'Ambulance · ആംബുലൻസ്', label: '🚑 Ambulance' },
      { id: 'Doctor / Medical · ഡോക്ടർ', label: '🩺 Doctor' },
      { id: 'Other Public Service · മറ്റ് സേവനം', label: '📌 Other Service' },
    ],
    nameLabel: 'Institution / Office / Person Name / പേര്',
    namePlaceholder: 'Office or contact name',
    areaLabel: 'Location / Office Address / സ്ഥലം',
    areaPlaceholder: 'Location or landmark',
  },
  {
    type: 'school',
    label: 'School / Madrassa',
    ml: 'സ്കൂൾ / മദ്രസ',
    icon: '🏫',
    backHref: '/schools',
    backLabel: 'Schools & Madrassas',
    desc: 'Submit school, madrassa, or educational institution details with HM, Sadar Ustad, PTA, and office roles & contact numbers.',
    chipsTitle: 'Institution Type / സ്ഥാപന വിഭാഗം',
    chips: [
      { id: 'Govt LP / UP School · സർക്കാർ സ്കൂൾ', label: '🏫 Govt LP / UP School' },
      { id: 'High School / HSS · ഹൈസ്കൂൾ / ഹയർ സെക്കൻഡറി', label: '🎓 High School / HSS' },
      { id: 'English Medium School · ഇംഗ്ലീഷ് മീഡിയം', label: '📚 English Medium School' },
      { id: 'Madrassa & Dars · മദ്രസ / ദർസ്', label: '📖 Madrassa & Dars' },
      { id: 'Islamic / Arabic College · അറബിക് കോളേജ്', label: '🕌 Islamic / Arabic College' },
      { id: 'Anganwadi · അങ്കണവാടി', label: '🎒 Anganwadi / Pre-Primary' },
      { id: 'Other Institution · മറ്റ് സ്ഥാപനങ്ങൾ', label: '🏛️ Other Institution' },
    ],
    nameLabel: 'Institution Name / സ്ഥാപനത്തിന്റെ പേര്',
    namePlaceholder: 'e.g. GLPS Pailippuram, Hidayathul Muslimeen Madrassa',
    areaLabel: 'Location / Area in Pailippuram / സ്ഥലം',
    areaPlaceholder: 'e.g. School Padi, Thiruvegappura, Valiyakunnu',
  },
  {
    type: 'announcement',
    label: 'Announcement',
    ml: 'അറിയിപ്പുകൾ',
    icon: '📢',
    backHref: '/announcements',
    backLabel: 'Announcements',
    desc: 'Share public community news, festival dates, medical camps, or local notices.',
    chipsTitle: 'Announcement Category / വിഭാഗം',
    chips: [
      { id: 'Public Notice · പൊതു അറിയിപ്പ്', label: '📢 Public Notice' },
      { id: 'Medical Camp · മെഡിക്കൽ ക്യാമ്പ്', label: '🏥 Medical Camp' },
      { id: 'Festival / Event · ഉത്സവം / പരിപാടി', label: '🎪 Festival / Event' },
      { id: 'Club / Sports · കായിക മത്സരം', label: '⚽ Sports / Club' },
      { id: 'Job / Meeting · യോഗം', label: '👥 Meeting / Notice' },
      { id: 'Other · മറ്റ് അറിയിപ്പ്', label: '📌 Other' },
    ],
    nameLabel: 'Announcement Title / ശീർഷകം',
    namePlaceholder: 'Announcement title',
    areaLabel: 'Venue / Location / പരിപാടി നടക്കുന്ന സ്ഥലം',
    areaPlaceholder: 'Venue or location',
  },
  {
    type: 'other',
    label: 'Something else',
    ml: 'മറ്റുള്ളവ',
    icon: '✨',
    backHref: '/',
    backLabel: 'Home',
    desc: 'Any other helpful community information for Pailippuram.',
    chipsTitle: 'Subject Type / വിഷയം',
    chips: [
      { id: 'Community Info · പൊതു വിവരം', label: 'ℹ️ General Community Info' },
      { id: 'Local Query · സംശയം', label: '❓ Local Query' },
      { id: 'Suggestion · നിർദ്ദേശം', label: '💡 App Suggestion' },
    ],
    nameLabel: 'Subject or Title / വിഷയം',
    namePlaceholder: 'Title',
    areaLabel: 'Area / സ്ഥലം',
    areaPlaceholder: 'Location',
  },
];

function ShareFormInner() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'transport';

  const [type, setType] = useState(() => {
    return MENUS.some((m) => m.type === initialType) ? initialType : 'transport';
  });

  // Listen to searchParams change if user navigates back/forward
  useEffect(() => {
    const qType = searchParams.get('type');
    if (qType && MENUS.some((m) => m.type === qType)) {
      setType(qType);
    }
  }, [searchParams]);

  const activeMenu = MENUS.find((m) => m.type === type) || MENUS[0];

  // Specific form states
  const [selectedChip, setSelectedChip] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalPhones, setAdditionalPhones] = useState([]);
  const [whatsapp, setWhatsapp] = useState('');
  const [area, setArea] = useState('');
  const [details, setDetails] = useState('');

  // Transport specific
  const [vehicleModel, setVehicleModel] = useState('');
  const [is24Hours, setIs24Hours] = useState(false);

  // Shop specific
  const [workingHours, setWorkingHours] = useState('');
  const [hasHomeDelivery, setHasHomeDelivery] = useState(false);

  // Worker specific
  const [experience, setExperience] = useState('');

  // Donor specific
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [age, setAge] = useState('');
  const [emergencyReady, setEmergencyReady] = useState(true);

  // Announcement specific
  const [eventDate, setEventDate] = useState('');
  const [organizedBy, setOrganizedBy] = useState('');

  // School & Madrassa specific roles
  const [headRole, setHeadRole] = useState('Headmaster (HM)');
  const [headName, setHeadName] = useState('');
  const [headPhone, setHeadPhone] = useState('');
  const [ptaName, setPtaName] = useState('');
  const [ptaPhone, setPtaPhone] = useState('');
  const [busPhone, setBusPhone] = useState('');

  // Custom Category states for user panel
  const [customCatName, setCustomCatName] = useState('');
  const [customCatMl, setCustomCatMl] = useState('');
  const [dbCategories, setDbCategories] = useState([]);

  // Common submitter metadata
  const [submitterContact, setSubmitterContact] = useState('');
  const [consent, setConsent] = useState(true);
  const [honeypot, setHoneypot] = useState(''); // Anti-bot trap

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  // Fetch registered DB categories for the active kind
  useEffect(() => {
    if (type === 'donor' || type === 'announcement' || type === 'other') {
      setDbCategories([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const queryKind = type === 'school' ? 'contact' : type;
        const res = await fetch(`/api/categories?kind=${encodeURIComponent(queryKind)}`);
        const data = await res.json();
        if (!cancelled && data.categories) {
          setDbCategories(data.categories);
        }
      } catch {
        // keep presets
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  // Combine static presets with live database categories (and "+ Custom Category" option)
  const displayedChips = useMemo(() => {
    if (type === 'donor') return activeMenu.chips || [];
    const presetChips = activeMenu.chips || [];
    const seen = new Set(presetChips.map((c) => c.id.toLowerCase()));

    const extra = [];
    dbCategories.forEach((c) => {
      const key = (c.name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        extra.push({
          id: c.name,
          catId: c.id,
          label: c.name_ml ? `${c.name} · ${c.name_ml}` : c.name,
        });
      }
    });

    const combined = [...presetChips, ...extra];
    if (['transport', 'business', 'worker', 'contact', 'school'].includes(type)) {
      combined.push({
        id: '__custom__',
        label: '✨ + Custom Category · മറ്റ് പുതിയ വിഭാഗം',
        isCustomTrigger: true,
      });
    }
    return combined;
  }, [activeMenu, dbCategories, type]);

  // Reset or initialize default chip when type, displayedChips, or searchParams change
  useEffect(() => {
    const qCat = searchParams ? searchParams.get('cat') : null;
    const isCustom = searchParams ? searchParams.get('custom') : null;

    if (qCat) {
      const match = displayedChips.find(
        (c) =>
          c.id.toLowerCase() === qCat.toLowerCase() ||
          (c.label && c.label.toLowerCase().includes(qCat.toLowerCase()))
      );
      if (match) {
        setSelectedChip(match.id);
      } else {
        setSelectedChip('__custom__');
        setCustomCatName(qCat);
      }
    } else if (isCustom === '1') {
      setSelectedChip('__custom__');
    } else if (displayedChips && displayedChips.length > 0) {
      if (type === 'donor') {
        setBloodGroup('O+');
        setSelectedChip('O+');
      } else {
        setSelectedChip(displayedChips[0].id);
      }
    } else {
      setSelectedChip('');
    }
  }, [type, displayedChips, searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    // Hidden trap check for bots
    if (honeypot) {
      setDone(true);
      return;
    }

    if (name.trim().length < 2) {
      setErrorMsg(`Please enter a valid ${activeMenu.nameLabel.split('/')[0].trim().toLowerCase()}.`);
      return;
    }

    if (!consent) {
      setErrorMsg('Please confirm the agreement checkbox to proceed.');
      return;
    }

    setBusy(true);

    let categoryIdToTag = null;
    let effectiveCategoryLabel = selectedChip;

    if (selectedChip === '__custom__') {
      if (!customCatName.trim() || customCatName.trim().length < 2) {
        setErrorMsg('Please enter your custom category name (at least 2 characters).');
        setBusy(false);
        return;
      }
      effectiveCategoryLabel = customCatName.trim();
      try {
        const catRes = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: type === 'business' ? 'business' : type,
            name: customCatName.trim(),
            name_ml: customCatMl.trim() || undefined,
          }),
        });
        const catData = await catRes.json();
        if (catData && catData.category && catData.category.id) {
          categoryIdToTag = catData.category.id;
        }
      } catch {
        // proceed with label
      }
    } else {
      const matchedDb = dbCategories.find(
        (c) =>
          c.name.toLowerCase() === (selectedChip || '').toLowerCase() ||
          (c.id && String(c.id) === String(selectedChip))
      );
      if (matchedDb) {
        categoryIdToTag = matchedDb.id;
      }
    }

    // Compile customized structured description tailored to each menu
    let structuredDesc = '';
    let finalTitle = name.trim();

    if (type === 'transport') {
      const parts = [
        `Vehicle Type: ${effectiveCategoryLabel || 'Transport'}`,
        vehicleModel.trim() && `Vehicle Model / No: ${vehicleModel.trim()}`,
        is24Hours && `Service Availability: 24 Hours / 24 മണിക്കൂറും ലഭ്യമാണ്`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `Details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else if (type === 'business') {
      const parts = [
        `Category: ${effectiveCategoryLabel || 'Shop'}`,
        workingHours.trim() && `Hours: ${workingHours.trim()}`,
        hasHomeDelivery && `Home Delivery: Available / ഹോം ഡെലിവറി ഉണ്ട്`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `About Shop / Products: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else if (type === 'worker') {
      const parts = [
        `Trade / Skill: ${effectiveCategoryLabel || 'Worker'}`,
        experience.trim() && `Work details: ${experience.trim()}`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `Extra details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else if (type === 'donor') {
      const group = bloodGroup || selectedChip || 'O+';
      finalTitle = `${name.trim()} (${group})`;
      const parts = [
        `Blood Group: ${group}`,
        age.trim() && `Age: ${age.trim()}`,
        emergencyReady && `Emergency calls: Ready / അടിയന്തിര ആവശ്യത്തിന് വിളിക്കാം`,
        details.trim() && `Notes: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else if (type === 'contact') {
      const parts = [
        `Category: ${effectiveCategoryLabel || 'Contact'}`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `Details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else if (type === 'school') {
      const parts = [
        `[EDUCATION]`,
        `Type: ${effectiveCategoryLabel || 'School / Madrassa'}`,
        workingHours.trim() && `Hours: ${workingHours.trim()}`,
        `Roles:`,
        (headName.trim() || headPhone.trim()) && `- ${headRole}: ${headName.trim()} | ${headPhone.trim()}`,
        phone.trim() && `- Office Desk: ${phone.trim()}`,
        (ptaName.trim() || ptaPhone.trim()) && `- PTA President / Committee: ${ptaName.trim()} | ${ptaPhone.trim()}`,
        busPhone.trim() && `- School / Madrasa Bus Driver: ${busPhone.trim()}`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `Details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else if (type === 'announcement') {
      const parts = [
        `Category: ${effectiveCategoryLabel || 'Notice'}`,
        eventDate && `Event Date: ${eventDate}`,
        organizedBy.trim() && `Organized By: ${organizedBy.trim()}`,
        details.trim() && `Details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else {
      const parts = [
        effectiveCategoryLabel && `Subject: ${effectiveCategoryLabel}`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `Details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    }

    if (categoryIdToTag) {
      structuredDesc = `${structuredDesc}\n[CAT_ID:${categoryIdToTag}]`;
    }

    let primaryPhone = phone.trim();
    const extraPhones = additionalPhones.map((p) => p.trim()).filter(Boolean);

    // If the user typed multiple numbers in the primary phone field
    if (primaryPhone.includes(',') || primaryPhone.includes('/') || primaryPhone.includes(';')) {
      const parts = primaryPhone.split(/[,/;\n]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        primaryPhone = parts[0];
        for (let i = 1; i < parts.length; i++) {
          if (!extraPhones.includes(parts[i])) {
            extraPhones.push(parts[i]);
          }
        }
      }
    }

    if (extraPhones.length > 0) {
      const extraPhonesText = `Alt Phones: ${extraPhones.join(', ')}`;
      structuredDesc = structuredDesc ? `${structuredDesc}\n${extraPhonesText}` : extraPhonesText;
    }

    const resError = await sendSubmission({
      type,
      title: finalTitle,
      description: structuredDesc.slice(0, 1500) || null,
      phone: primaryPhone.slice(0, 20) || null,
      area: area.trim() || null,
      submitter_contact: submitterContact.trim() || null,
      consent,
    });

    setBusy(false);

    if (resError) {
      setErrorMsg(resError);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="page">
        <PageHeader title="Thank you" ml="വിവരം ലഭിച്ചു" />
        <main className="body" style={{ textAlign: 'center', paddingTop: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--accent-tint)',
              color: 'var(--gold-dark)',
              border: '2px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>Thank you! വിവരങ്ങൾ അയച്ചു</h2>
          <p className="muted" style={{ lineHeight: 1.5, marginBottom: 24 }}>
            Your information for <strong>{activeMenu.label}</strong> has been received. A admin will verify it before it appears on the website.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeMenu.backHref && (
              <Link href={activeMenu.backHref} className="btn dark big">
                Go to {activeMenu.backLabel} ({activeMenu.ml})
              </Link>
            )}
            <button
              type="button"
              className="btn light"
              onClick={() => {
                setDone(false);
                setName('');
                setPhone('');
                setWhatsapp('');
                setArea('');
                setDetails('');
                setVehicleModel('');
                setWorkingHours('');
              }}
            >
              + Share another listing · മറ്റൊന്ന് ചേർക്കുക
            </button>
            <Link href="/" className="btn">
              Back to Home · പ്രധാന പേജിലേക്ക്
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="Share Information" ml="വിവരം പങ്കിടുക" />
      <form className="body" onSubmit={handleSubmit}>
        {/* Helper Note Banner */}
        <div className="note" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <span>
            <strong>Checked by local residents.</strong> Every submission is reviewed by an admin before going live.
          </span>
        </div>

        {/* 1. Category Switcher Chips */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="label" style={{ fontSize: 15, fontWeight: 700 }}>
              What are you adding? · എന്ത് വിവരമാണ് നൽകുന്നത്?
            </span>
          </div>
          <div className="chips" style={{ gap: 8 }}>
            {MENUS.map((m) => {
              const active = type === m.type;
              return (
                <button
                  key={m.type}
                  type="button"
                  className={`chip ${active ? 'on' : ''}`}
                  onClick={() => setType(m.type)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Category Header Card */}
        <div
          style={{
            background: 'var(--accent-tint)',
            border: '1.5px solid var(--accent-border)',
            borderRadius: 16,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>{activeMenu.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
                {activeMenu.label} · {activeMenu.ml}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{activeMenu.desc}</div>
            </div>
          </div>
          <span className="pill" style={{ flexShrink: 0 }}>
            Dedicated Form
          </span>
        </div>

        {/* 2. Specialized Chips for the active menu */}
        {activeMenu.chips && activeMenu.chips.length > 0 && (
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{activeMenu.chipsTitle}</label>

            {type === 'donor' ? (
              // Blood Donor 1-tap Buttons Grid
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 4 }}>
                {BLOOD_GROUPS.map((bg) => {
                  const sel = bloodGroup === bg;
                  return (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => {
                        setBloodGroup(bg);
                        setSelectedChip(bg);
                      }}
                      style={{
                        minHeight: 46,
                        borderRadius: 12,
                        border: sel ? '2px solid var(--accent)' : '1.5px solid var(--card-border)',
                        background: sel ? 'var(--primary)' : '#ffffff',
                        color: sel ? '#ffffff' : 'var(--ink)',
                        fontWeight: 800,
                        fontSize: 18,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {bg}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Standard & Custom Subcategory Selection Chips
              <>
                <div className="chips" style={{ marginTop: 4, gap: 6 }}>
                  {displayedChips.map((c) => {
                    const sel = selectedChip === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`chip ${sel ? 'on' : ''}`}
                        onClick={() => setSelectedChip(c.id)}
                        style={{
                          fontSize: 13,
                          padding: '4px 12px',
                          minHeight: 34,
                          fontWeight: c.isCustomTrigger ? 800 : undefined,
                          borderColor: c.isCustomTrigger && sel ? 'var(--accent)' : undefined,
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Category Input Block (shown when "+ Custom Category" is chosen) */}
                {selectedChip === '__custom__' && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '14px 16px',
                      background: 'var(--accent-tint)',
                      border: '1.5px solid var(--accent-border)',
                      borderRadius: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                      Enter Custom Category Name / പുതിയ വിഭാഗത്തിന്റെ പേര് *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Category Name in English *"
                        value={customCatName}
                        onChange={(e) => setCustomCatName(e.target.value)}
                        required={selectedChip === '__custom__'}
                        style={{ minHeight: 40, fontSize: 13 }}
                      />
                      <input
                        type="text"
                        placeholder="Malayalam Name (മലയാളത്തിൽ - optional)"
                        value={customCatMl}
                        onChange={(e) => setCustomCatMl(e.target.value)}
                        style={{ minHeight: 40, fontSize: 13 }}
                      />
                    </div>
                    <p className="small muted" style={{ margin: 0, fontSize: 11.5 }}>
                      💡 This category will be created and saved. Both you and the admin can see it, and it will automatically appear in the public listings page once your entry is approved.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 3. Primary Name / Title field */}
        <div className="field">
          <label htmlFor="form-name">{activeMenu.nameLabel} *</label>
          <input
            id="form-name"
            type="text"
            maxLength={120}
            required
            placeholder={activeMenu.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 4. Menu-Specific Extra Fields */}

        {/* TRANSPORT EXTRAS */}
        {type === 'transport' && (
          <>
            <div className="field">
              <label htmlFor="veh-model">Vehicle Model or Number / വാഹനം മോഡൽ (optional)</label>
              <input
                id="veh-model"
                type="text"
                maxLength={60}
                placeholder="Vehicle model or number"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>
            <div className="check" style={{ marginTop: 4 }}>
              <input
                id="is-24h"
                type="checkbox"
                checked={is24Hours}
                onChange={(e) => setIs24Hours(e.target.checked)}
              />
              <label htmlFor="is-24h" style={{ fontSize: 14 }}>
                <strong>24 Hours Available / 24 മണിക്കൂറും സർവീസ് ലഭ്യമാണ്</strong> (Night trips, emergency hospital drops)
              </label>
            </div>
          </>
        )}

        {/* SHOP EXTRAS */}
        {type === 'business' && (
          <>
            <div className="field">
              <label htmlFor="shop-hours">Opening Hours / പ്രവർത്തന സമയം (optional)</label>
              <input
                id="shop-hours"
                type="text"
                maxLength={60}
                placeholder="Working hours"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
              />
            </div>
            <div className="check" style={{ marginTop: 4 }}>
              <input
                id="shop-delivery"
                type="checkbox"
                checked={hasHomeDelivery}
                onChange={(e) => setHasHomeDelivery(e.target.checked)}
              />
              <label htmlFor="shop-delivery" style={{ fontSize: 14 }}>
                <strong>Home Delivery Available / വീട്ടിൽ എത്തിച്ചു നൽകുന്നു</strong>
              </label>
            </div>
          </>
        )}

        {/* WORKER EXTRAS */}
        {type === 'worker' && (
          <div className="field">
            <label htmlFor="worker-exp">Specialty or Work Types / പ്രത്യേകതകൾ (optional)</label>
            <input
              id="worker-exp"
              type="text"
              maxLength={120}
              placeholder="Specialty or work types"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>
        )}

        {/* DONOR EXTRAS */}
        {type === 'donor' && (
          <>
            <div className="field">
              <label htmlFor="donor-age">Age / പ്രായം (optional)</label>
              <input
                id="donor-age"
                type="text"
                maxLength={3}
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="check" style={{ marginTop: 4 }}>
              <input
                id="donor-em"
                type="checkbox"
                checked={emergencyReady}
                onChange={(e) => setEmergencyReady(e.target.checked)}
              />
              <label htmlFor="donor-em" style={{ fontSize: 14 }}>
                <strong>Willing to donate in emergency / അടിയന്തിര ആവശ്യത്തിന് വിളിക്കാം</strong>
              </label>
            </div>
          </>
        )}

        {/* SCHOOL & MADRASSA ROLES EXTRAS */}
        {type === 'school' && (
          <div
            style={{
              padding: '16px',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 14, color: '#334155' }}>
              <span>👔</span>
              <span>Key Roles & Direct Contacts · പ്രധാന ഭാരവാഹികൾ</span>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.4 }}>
              Enter the names and direct contact numbers for this school or madrassa (HM, Principal, Sadar Ustad, PTA President, etc.).
            </p>

            {/* Role 1: Head / HM / Sadar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                Headmaster / Principal / Sadar Ustad
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, 160px) 1fr 1fr', gap: 8 }}>
                <select
                  value={headRole}
                  onChange={(e) => setHeadRole(e.target.value)}
                  style={{ minHeight: 40, fontSize: 13, fontWeight: 600 }}
                >
                  <option value="Headmaster (HM)">Headmaster (HM)</option>
                  <option value="Headmistress (HM)">Headmistress (HM)</option>
                  <option value="Principal">Principal</option>
                  <option value="Sadar Ustad">Sadar Ustad</option>
                  <option value="Chief Mudarris">Chief Mudarris</option>
                  <option value="Anganwadi Worker">Anganwadi Worker</option>
                </select>
                <input
                  type="text"
                  placeholder="Person Name (പേര്)"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  style={{ minHeight: 40, fontSize: 13 }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number (നമ്പർ)"
                  value={headPhone}
                  onChange={(e) => setHeadPhone(e.target.value)}
                  style={{ minHeight: 40, fontSize: 13 }}
                />
              </div>
            </div>

            {/* Role 2: PTA President / Committee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  PTA President / Management Leader
                </label>
                <input
                  type="text"
                  placeholder="Name (പേര്)"
                  value={ptaName}
                  onChange={(e) => setPtaName(e.target.value)}
                  style={{ minHeight: 40, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  PTA / Leader Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Phone number (ഫോൺ)"
                  value={ptaPhone}
                  onChange={(e) => setPtaPhone(e.target.value)}
                  style={{ minHeight: 40, fontSize: 13 }}
                />
              </div>
            </div>

            {/* Role 3: Bus Driver */}
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="school-bus" style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                🚌 School / Madrasa Bus Driver Phone (optional)
              </label>
              <input
                id="school-bus"
                type="tel"
                placeholder="Bus driver phone number"
                value={busPhone}
                onChange={(e) => setBusPhone(e.target.value)}
                style={{ minHeight: 40, fontSize: 13 }}
              />
            </div>

            {/* Working / Class Hours */}
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="school-hours" style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                🕒 Class & Working Hours (e.g. 9:30 AM - 4:00 PM or 7:00 AM - 8:30 AM)
              </label>
              <input
                id="school-hours"
                type="text"
                placeholder="e.g. 9:30 AM - 4:00 PM"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                style={{ minHeight: 40, fontSize: 13 }}
              />
            </div>
          </div>
        )}

        {/* ANNOUNCEMENT EXTRAS */}
        {type === 'announcement' && (
          <>
            <div className="field">
              <label htmlFor="event-date">Date of Event / തീയതി (optional)</label>
              <input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="org-by">Organized By / സംഘാടകർ (optional)</label>
              <input
                id="org-by"
                type="text"
                maxLength={80}
                placeholder="Organized by"
                value={organizedBy}
                onChange={(e) => setOrganizedBy(e.target.value)}
              />
            </div>
          </>
        )}

        {/* 5. Contact Phone Number & Multiple Numbers (Public) */}
        <MultiPhoneInput
          primaryPhone={phone}
          onPrimaryChange={setPhone}
          additionalPhones={additionalPhones}
          onAdditionalChange={setAdditionalPhones}
          required={type !== 'announcement'}
          label="Phone Number / ഫോൺ നമ്പർ"
          placeholder="Primary phone number (e.g. 9846012345)"
          maxPhones={6}
        />

        {/* WhatsApp Number (optional) */}
        {type !== 'donor' && (
          <div className="field">
            <label htmlFor="form-wa">
              WhatsApp Number / വാട്സാപ്പ് നമ്പർ <span className="muted small">(optional, if different)</span>
            </label>
            <input
              id="form-wa"
              type="tel"
              maxLength={20}
              placeholder="WhatsApp number (if different)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
        )}

        {/* 6. Area / Location */}
        <div className="field">
          <label htmlFor="form-area">{activeMenu.areaLabel}</label>
          <input
            id="form-area"
            type="text"
            maxLength={80}
            placeholder={activeMenu.areaPlaceholder}
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>

        {/* 7. Extra details textarea */}
        <div className="field">
          <label htmlFor="form-details">
            Additional Details / കൂടുതൽ വിവരങ്ങൾ <span className="muted small">(optional)</span>
          </label>
          <textarea
            id="form-details"
            maxLength={1000}
            placeholder="Additional details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        {/* 8. Private submitter contact */}
        <div className="field" style={{ borderTop: '1px solid var(--card-border)', paddingTop: 16 }}>
          <label htmlFor="sub-contact">
            Your Contact Info / താങ്കളുടെ ഫോൺ / ഇമെയിൽ{' '}
            <span className="muted small">(private, never displayed on the site)</span>
          </label>
          <input
            id="sub-contact"
            type="text"
            maxLength={120}
            placeholder="Phone or email (private)"
            value={submitterContact}
            onChange={(e) => setSubmitterContact(e.target.value)}
          />
        </div>

        {/* Bot trap field */}
        <div className="hp" aria-hidden="true">
          <label htmlFor="bot-hp">Do not fill this</label>
          <input
            id="bot-hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {/* Consent checkbox */}
        <div className="check" style={{ marginTop: 4 }}>
          <input
            id="form-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <label htmlFor="form-consent" style={{ fontSize: 13.5, lineHeight: 1.4 }}>
            I confirm that I have permission to share this information and that anyone named here has agreed to be listed in Pailippuram directory.
          </label>
        </div>

        {errorMsg ? <p className="error" role="alert">{errorMsg}</p> : null}

        {/* Submit Button */}
        <button type="submit" className="btn dark big" disabled={busy} style={{ marginTop: 8 }}>
          {busy ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Submitting for Review...
            </span>
          ) : (
            `Submit for Review · അയക്കുക`
          )}
        </button>

        {/* Review Process Information */}
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>What happens next · അടുത്തത് എന്ത്?</h2>
          <div className="steps">
            <div className="step">
              <b>1</b>
              <span>A local admin reviews the submission to confirm genuine details.</span>
            </div>
            <div className="step">
              <b>2</b>
              <span>Once approved, it becomes instantly searchable in the Pailippuram directory.</span>
            </div>
            <div className="step">
              <b>3</b>
              <span>If you provided contact info, the admin can confirm if any questions arise.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function Share() {
  return (
    <Suspense fallback={<div className="page"><PageHeader title="Share Information" ml="വിവരം പങ്കിടുക" /><main className="body"><p className="muted">Loading form...</p></main></div>}>
      <ShareFormInner />
    </Suspense>
  );
}
