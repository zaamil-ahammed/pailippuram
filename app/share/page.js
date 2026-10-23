'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import { sendSubmission } from '../../lib/submit';
import { BLOOD_GROUPS } from '../../lib/sections';
import { useIsAdmin } from '../../lib/useAdmin';
import { useRows } from '../../lib/useRows';

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
  const { isAdmin } = useIsAdmin();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'transport';

  // For normal users, hide the custom / unclassified 'other' category
  const availableMenus = useMemo(() => {
    if (isAdmin) return MENUS;
    return MENUS.filter((m) => m.type !== 'other');
  }, [isAdmin]);

  const [type, setType] = useState(() => {
    const valid = availableMenus.some((m) => m.type === initialType);
    return valid ? initialType : 'transport';
  });

  // Listen to searchParams change if user navigates back/forward
  useEffect(() => {
    const qType = searchParams.get('type');
    if (qType && availableMenus.some((m) => m.type === qType)) {
      setType(qType);
    } else if (qType === 'other' && !isAdmin) {
      setType('transport');
    }
  }, [searchParams, availableMenus, isAdmin]);

  // Ensure normal users never remain on 'other' category
  useEffect(() => {
    if (!isAdmin && type === 'other') {
      setType('transport');
    }
  }, [isAdmin, type]);

  const activeMenu = availableMenus.find((m) => m.type === type) || availableMenus[0] || MENUS[0];

  // DB categories created by admins available for selection
  const cats = useRows((s) => s.from('categories').select('*').order('name'), []);

  // For normal users, hide unclassified "Other ..." category chips and only allow picking existing categories
  const activeChips = useMemo(() => {
    const list = [...(activeMenu.chips || [])];

    // Merge database categories created by admins for this section
    if (type !== 'donor' && cats.rows && cats.rows.length > 0) {
      const typeKindMap = {
        transport: ['transport'],
        business: ['business', 'shop'],
        worker: ['worker'],
        contact: ['contact', 'education'],
      };
      const validKinds = typeKindMap[type] || [];
      const dbCats = cats.rows.filter((c) => validKinds.includes(c.kind));
      for (const dc of dbCats) {
        const cleanName = dc.name?.trim();
        if (!cleanName) continue;
        const exists = list.some((item) =>
          (item.id || '').toLowerCase().includes(cleanName.toLowerCase()) ||
          cleanName.toLowerCase().includes((item.id || '').toLowerCase())
        );
        if (!exists) {
          list.push({
            id: `[CAT_ID: ${dc.id}] ${cleanName}${dc.name_ml ? ' · ' + dc.name_ml : ''}`,
            label: `🏷️ ${cleanName}${dc.name_ml ? ' (' + dc.name_ml + ')' : ''}`,
          });
        }
      }
    }

    if (isAdmin) return list;
    return list.filter((c) => {
      const id = (c.id || '').toLowerCase();
      const label = (c.label || '').toLowerCase();
      return !id.startsWith('other') && !label.startsWith('other') && !id.includes('other ') && !label.includes('other ');
    });
  }, [activeMenu, isAdmin, cats.rows, type]);

  // Specific form states
  const [selectedChip, setSelectedChip] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalPhones, setAdditionalPhones] = useState([]);
  const [whatsapp, setWhatsapp] = useState('');
  const [area, setArea] = useState('');
  const [details, setDetails] = useState('');

  const addPhone = () => {
    if (additionalPhones.length < 3) {
      setAdditionalPhones((prev) => [...prev, '']);
    }
  };

  const updatePhone = (index, val) => {
    setAdditionalPhones((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const removePhone = (index) => {
    setAdditionalPhones((prev) => prev.filter((_, i) => i !== index));
  };

  // Lightweight optional note & category extras
  const [note, setNote] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [eventDate, setEventDate] = useState('');

  // Common submitter metadata
  const [submitterContact, setSubmitterContact] = useState('');
  const [consent, setConsent] = useState(true);
  const [honeypot, setHoneypot] = useState(''); // Anti-bot trap

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  // Reset or initialize default chip when type or activeChips change
  useEffect(() => {
    if (activeChips && activeChips.length > 0) {
      if (type === 'donor') {
        setBloodGroup('O+');
        setSelectedChip('O+');
      } else {
        setSelectedChip(activeChips[0].id);
      }
    } else {
      setSelectedChip('');
    }
  }, [type, activeChips]);

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

    let finalTitle = name.trim();
    if (type === 'donor') {
      const group = bloodGroup || selectedChip || 'O+';
      finalTitle = `${name.trim()} (${group})`;
    }

    let structuredDesc = note.trim();
    if (selectedChip && type !== 'donor') {
      const chipObj = activeChips.find((c) => c.id === selectedChip);
      const cleanCat = (chipObj?.label || selectedChip).replace(/^[^\w\s\u0D00-\u0D7F]+/gu, '').trim();
      structuredDesc = `[Category: ${cleanCat}]\n${structuredDesc}`.trim();
    }
    if (type === 'announcement' && eventDate) {
      structuredDesc = structuredDesc ? `Date: ${eventDate}\n${structuredDesc}` : `Date: ${eventDate}`;
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
      description: structuredDesc ? structuredDesc.slice(0, 500) : null,
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
                setNote('');
                setEventDate('');
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
            {availableMenus.map((m) => {
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
        {activeChips && activeChips.length > 0 && (
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
              // Standard Subcategory Selection Chips
              <div className="chips" style={{ marginTop: 4, gap: 6 }}>
                {activeChips.map((c) => {
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

        {/* Date for announcements */}
        {type === 'announcement' && (
          <div className="field">
            <label htmlFor="event-date">Date of Event / തീയതി (optional)</label>
            <input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        )}

        {/* 5. Contact Phone Number (Public) */}
        <div className="field">
          <label htmlFor="form-phone">
            Phone Number / ഫോൺ നമ്പർ {type !== 'announcement' ? '*' : '(optional)'}
          </label>
          <input
            id="form-phone"
            type="tel"
            maxLength={20}
            placeholder="Primary phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Additional Phone Numbers */}
        {additionalPhones.map((p, idx) => (
          <div key={idx} className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor={`form-phone-${idx + 2}`} style={{ fontSize: 14 }}>
                Phone Number {idx + 2} / രണ്ടാമത്തെ നമ്പർ <span className="muted small">(optional)</span>
              </label>
              <button
                type="button"
                onClick={() => removePhone(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontWeight: 600,
                }}
              >
                ✕ Remove
              </button>
            </div>
            <input
              id={`form-phone-${idx + 2}`}
              type="tel"
              maxLength={20}
              placeholder={`Additional phone number ${idx + 2}`}
              value={p}
              onChange={(e) => updatePhone(idx, e.target.value)}
            />
          </div>
        ))}

        {additionalPhones.length < 3 && (
          <div style={{ marginTop: -2, marginBottom: 4 }}>
            <button
              type="button"
              className="btn light"
              onClick={addPhone}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                minHeight: 38,
                fontSize: 13.5,
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              + Add another phone number / മറ്റൊരു നമ്പർ ചേർക്കുക
            </button>
          </div>
        )}

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

        {/* Optional note */}
        <div className="field">
          <label htmlFor="form-note">
            Note / കുറിപ്പ് <span className="muted small">(optional)</span>
          </label>
          <input
            id="form-note"
            type="text"
            maxLength={180}
            placeholder="Brief note or landmark (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
