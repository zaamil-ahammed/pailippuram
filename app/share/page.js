'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
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
    namePlaceholder: 'e.g. Rajesh Auto / City Taxi / Al-Ameen Tipper',
    areaLabel: 'Stand / Location / സ്റ്റാൻഡ്',
    areaPlaceholder: 'e.g. Pailippuram Stand, Hospital Junction',
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
    namePlaceholder: 'e.g. Green Valley Supermarket / Modern Medicals',
    areaLabel: 'Place / Landmark in Pailippuram / സ്ഥലം',
    areaPlaceholder: 'e.g. Near Post Office / Pailippuram Town',
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
    namePlaceholder: 'e.g. Muhammed Ali / Suresh & Team Plumbing',
    areaLabel: 'Area / Ward in Pailippuram / സ്ഥലം',
    areaPlaceholder: 'e.g. Ward 4 / Padinjattamuri / Town',
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
    namePlaceholder: 'e.g. Rahul K / Fathima P',
    areaLabel: 'Area / Ward in Pailippuram / സ്ഥലം',
    areaPlaceholder: 'e.g. Pailippuram Center / Kizhakkumuri',
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
    namePlaceholder: 'e.g. Primary Health Centre / KSEB Substation',
    areaLabel: 'Location / Office Address / സ്ഥലം',
    areaPlaceholder: 'e.g. Pailippuram Main Road',
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
    namePlaceholder: 'e.g. Free Eye Checkup Camp at Pailippuram PHC',
    areaLabel: 'Venue / Location / പരിപാടി നടക്കുന്ന സ്ഥലം',
    areaPlaceholder: 'e.g. Pailippuram Community Hall',
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
    namePlaceholder: 'Brief title of what you are sharing',
    areaLabel: 'Area / സ്ഥലം',
    areaPlaceholder: 'e.g. Pailippuram',
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

  // Common submitter metadata
  const [submitterContact, setSubmitterContact] = useState('');
  const [consent, setConsent] = useState(true);
  const [honeypot, setHoneypot] = useState(''); // Anti-bot trap

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  // Reset or initialize default chip when type changes
  useEffect(() => {
    if (activeMenu.chips && activeMenu.chips.length > 0) {
      if (type === 'donor') {
        setBloodGroup('O+');
        setSelectedChip('O+');
      } else {
        setSelectedChip(activeMenu.chips[0].id);
      }
    } else {
      setSelectedChip('');
    }
  }, [type, activeMenu]);

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

    // Compile customized structured description tailored to each menu
    let structuredDesc = '';
    let finalTitle = name.trim();

    if (type === 'transport') {
      const parts = [
        `Vehicle Type: ${selectedChip || 'Transport'}`,
        vehicleModel.trim() && `Vehicle Model / No: ${vehicleModel.trim()}`,
        is24Hours && `Service Availability: 24 Hours / 24 മണിക്കൂറും ലഭ്യമാണ്`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `Details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else if (type === 'business') {
      const parts = [
        `Category: ${selectedChip || 'Shop'}`,
        workingHours.trim() && `Hours: ${workingHours.trim()}`,
        hasHomeDelivery && `Home Delivery: Available / ഹോം ഡെലിവറി ഉണ്ട്`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `About Shop / Products: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else if (type === 'worker') {
      const parts = [
        `Trade / Skill: ${selectedChip || 'Worker'}`,
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
        `Category: ${selectedChip || 'Contact'}`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `Details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else if (type === 'announcement') {
      const parts = [
        `Category: ${selectedChip || 'Notice'}`,
        eventDate && `Event Date: ${eventDate}`,
        organizedBy.trim() && `Organized By: ${organizedBy.trim()}`,
        details.trim() && `Details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    } else {
      const parts = [
        selectedChip && `Subject: ${selectedChip}`,
        whatsapp.trim() && `WhatsApp: ${whatsapp.trim()}`,
        details.trim() && `Details: ${details.trim()}`,
      ].filter(Boolean);
      structuredDesc = parts.join('\n');
    }

    const resError = await sendSubmission({
      type,
      title: finalTitle,
      description: structuredDesc.slice(0, 1500) || null,
      phone: phone.trim() || null,
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
              background: '#ecfdf5',
              color: '#059669',
              border: '2px solid #a7f3d0',
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
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>
                {activeMenu.label} · {activeMenu.ml}
              </div>
              <div style={{ fontSize: 12.5, color: '#1e3a8a', marginTop: 1 }}>{activeMenu.desc}</div>
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
                        border: sel ? '2px solid #e11d48' : '1.5px solid var(--card-border)',
                        background: sel ? '#ffe4e6' : '#ffffff',
                        color: sel ? '#be123c' : 'var(--ink)',
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
              // Standard Subcategory Selection Chips
              <div className="chips" style={{ marginTop: 4, gap: 6 }}>
                {activeMenu.chips.map((c) => {
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
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
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
                placeholder="e.g. Maruti Dzire, Bajaj RE, JCB 3DX, Tata Ace"
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
                placeholder="e.g. 8:00 AM - 9:30 PM (Friday 2:00 PM - 9:30 PM)"
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
              placeholder="e.g. House wiring, motor pump repair, tile laying, daily / contract"
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
                placeholder="e.g. 25"
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
                placeholder="e.g. Youth Club Pailippuram, Gramapanchayath"
                value={organizedBy}
                onChange={(e) => setOrganizedBy(e.target.value)}
              />
            </div>
          </>
        )}

        {/* 5. Contact Phone Number (Public) */}
        <div className="field">
          <label htmlFor="form-phone">
            Phone Number to Show / വിളിക്കേണ്ട നമ്പർ {type !== 'announcement' ? '*' : '(optional)'}
          </label>
          <input
            id="form-phone"
            type="tel"
            maxLength={20}
            placeholder="e.g. 98470 00000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

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
              placeholder="e.g. 98470 00000"
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
        {type !== 'bus' && (
          <div className="field">
            <label htmlFor="form-details">
              Additional Details / കൂടുതൽ വിവരങ്ങൾ <span className="muted small">(optional)</span>
            </label>
            <textarea
              id="form-details"
              maxLength={1000}
              placeholder="Any other helpful details for the people of Pailippuram..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        )}

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
            placeholder="Only in case an admin needs to confirm with you"
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
