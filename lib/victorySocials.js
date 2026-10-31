// Helper for Victory Club NFC Socials, Phone Numbers & vCard generation

export function formatWhatsAppDigits(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

export function parseVictorySocials(member) {
  if (!member) {
    return {
      phone: '',
      alt_phone: '',
      email: '',
      whatsapp: '',
      instagram: 'https://www.instagram.com/victory_pailippuram',
      facebook: '',
      linkedin: '',
      twitter: '',
      website: '',
    };
  }

  let parsed = {};
  const rawLink = typeof member.link === 'string' ? member.link.trim() : '';

  if (rawLink.startsWith('{') && rawLink.endsWith('}')) {
    try {
      parsed = JSON.parse(rawLink);
    } catch {
      parsed = {};
    }
  }

  // Primary phone
  let primaryPhone = member.phone || parsed.phone || '';
  let altPhone = member.alt_phone || parsed.alt_phone || '';
  let email = member.email || parsed.email || '';

  // In case alt phone was embedded in phone string (e.g. "9847123456 / Alt: 9447012345")
  if (!altPhone && primaryPhone.includes('/')) {
    const parts = primaryPhone.split('/');
    primaryPhone = parts[0].trim();
    altPhone = parts.slice(1).join('/').replace(/alt:?/i, '').trim();
  }

  let instagram = member.instagram || parsed.instagram || '';
  if (!instagram) {
    if (rawLink && !rawLink.startsWith('{')) {
      instagram = rawLink;
    } else {
      instagram = 'https://www.instagram.com/victory_pailippuram';
    }
  }

  // Clean instagram handle if provided as @handle
  if (instagram.startsWith('@')) {
    instagram = `https://instagram.com/${instagram.slice(1)}`;
  } else if (instagram && !instagram.startsWith('http://') && !instagram.startsWith('https://')) {
    instagram = `https://${instagram}`;
  }

  const cleanUrl = (url, prefix) => {
    if (!url) return '';
    let u = url.trim();
    if (!u) return '';
    if (u.startsWith('@') && prefix) return `${prefix}${u.slice(1)}`;
    if (!u.startsWith('http://') && !u.startsWith('https://')) return `https://${u}`;
    return u;
  };

  return {
    phone: primaryPhone,
    alt_phone: altPhone,
    email: email.trim().toLowerCase(),
    whatsapp: member.whatsapp || parsed.whatsapp || primaryPhone,
    instagram,
    facebook: cleanUrl(member.facebook || parsed.facebook, 'https://facebook.com/'),
    linkedin: cleanUrl(member.linkedin || parsed.linkedin, 'https://linkedin.com/in/'),
    twitter: cleanUrl(member.twitter || parsed.twitter, 'https://x.com/'),
    website: cleanUrl(member.website || parsed.website, ''),
  };
}

export function encodeVictorySocials(data) {
  const cleanLink = (val, prefix) => {
    if (!val) return '';
    let s = String(val).trim();
    if (!s) return '';
    if (s.startsWith('@') && prefix) return `${prefix}${s.slice(1)}`;
    if (!s.startsWith('http://') && !s.startsWith('https://')) return `https://${s}`;
    return s;
  };

  const instagram = cleanLink(data.instagram || data.link, 'https://instagram.com/') || 'https://www.instagram.com/victory_pailippuram';
  const facebook = cleanLink(data.facebook, 'https://facebook.com/');
  const linkedin = cleanLink(data.linkedin, 'https://linkedin.com/in/');
  const twitter = cleanLink(data.twitter, 'https://x.com/');
  const website = cleanLink(data.website, '');
  const alt_phone = data.alt_phone ? String(data.alt_phone).trim() : '';
  const email = data.email ? String(data.email).trim().toLowerCase() : '';
  const whatsapp = data.whatsapp ? String(data.whatsapp).trim() : '';

  const hasExtra = Boolean(facebook || linkedin || twitter || website || alt_phone || email || whatsapp);

  if (!hasExtra) {
    return {
      link: instagram,
      phone: data.phone?.trim() || null,
      alt_phone: null,
      email: null,
    };
  }

  const payload = {
    instagram,
    facebook: facebook || undefined,
    linkedin: linkedin || undefined,
    twitter: twitter || undefined,
    website: website || undefined,
    alt_phone: alt_phone || undefined,
    email: email || undefined,
    whatsapp: whatsapp || undefined,
  };

  return {
    link: JSON.stringify(payload),
    phone: data.phone?.trim() || null,
    alt_phone: alt_phone || null,
    email: email || null,
  };
}

export function generateVictoryVCard(member, socials) {
  if (!member || !member.name) return '';

  const s = socials || parseVictorySocials(member);
  const nameParts = member.name.trim().split(' ');
  const firstName = nameParts[0] || member.name;
  const lastName = nameParts.slice(1).join(' ') || '';

  const rawBg = member.blood_group;
  const blood = Array.isArray(rawBg) ? rawBg[0] : (rawBg || 'Registered');
  const rawLoc = member.location;
  const loc = Array.isArray(rawLoc) ? rawLoc[0] : (rawLoc || 'Pailippuram, Kerala');

  const wingTitle = member.wing === 'non_committee'
    ? 'Club Member'
    : member.wing
    ? member.wing.toUpperCase()
    : 'Victory Club';

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${member.name}`,
    `N:${lastName};${firstName};;;`,
    'ORG:Victory Arts & Sports Club Pailippuram',
    member.role ? `TITLE:${member.role} (${wingTitle})` : `TITLE:${wingTitle}`,
    member.role_ml ? `X-ROLE-ML:${member.role_ml}` : '',
    s.phone ? `TEL;TYPE=CELL,VOICE,PREF:${s.phone}` : '',
    s.alt_phone ? `TEL;TYPE=WORK,VOICE:${s.alt_phone}` : '',
    s.email ? `EMAIL;TYPE=INTERNET,PREF:${s.email}` : '',
    s.instagram ? `URL;TYPE=Instagram:${s.instagram}` : '',
    s.facebook ? `URL;TYPE=Facebook:${s.facebook}` : '',
    s.linkedin ? `URL;TYPE=LinkedIn:${s.linkedin}` : '',
    s.twitter ? `URL;TYPE=Twitter:${s.twitter}` : '',
    s.website ? `URL;TYPE=Website:${s.website}` : '',
    `NOTE:Victory Club ${wingTitle} · Blood: ${blood} · Base: ${loc}`,
    'CATEGORIES:Victory Club,Community,Sports,NFC Profile',
    'END:VCARD',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadMemberVCard(member, socials) {
  const vCardString = generateVictoryVCard(member, socials);
  if (!vCardString) return;

  const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${(member.name || 'Member').replace(/\s+/g, '_')}_Victory.vcf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
