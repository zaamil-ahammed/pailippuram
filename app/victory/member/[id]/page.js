'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  MessageCircle,
  Share2,
  QrCode,
  UserCheck,
  ShieldCheck,
  MapPin,
  Droplet,
  Globe,
  ExternalLink,
  Download,
  ArrowLeft,
  Sparkles,
  Award,
  Layers,
  Check,
} from 'lucide-react';
import { STARTER_VICTORY_MEMBERS, memoryStore } from '../../../../lib/mockStore';
import NfcQrModal from '../../../../components/victory/NfcQrModal';

// Clean phone number for WhatsApp wa.me link
function formatWhatsAppNumber(phone) {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  // If 10 digits without country code, default to India (+91)
  if (digits.length === 10) return `91${digits}`;
  // If starts with 0 and length 11 (e.g. 050xxxxxxx in UAE or 0494xxxx in Kerala)
  if (digits.startsWith('0') && digits.length === 10) return `971${digits.slice(1)}`;
  return digits;
}

// Generate RFC 2426 vCard 3.0 string and trigger instant download
function downloadVCard(member) {
  if (!member || !member.name) return;

  const nameParts = member.name.trim().split(' ');
  const firstName = nameParts[0] || member.name;
  const lastName = nameParts.slice(1).join(' ') || '';

  const vCardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${member.name}`,
    `N:${lastName};${firstName};;;`,
    `ORG:Victory Club Pailippuram`,
    member.role ? `TITLE:${member.role}${member.wing ? ` (${member.wing.toUpperCase()})` : ''}` : 'TITLE:Member',
    member.role_ml ? `X-ROLE-ML:${member.role_ml}` : '',
    member.phone ? `TEL;TYPE=CELL,VOICE,PREF:${member.phone}` : '',
    member.link ? `URL:${member.link}` : 'URL:https://www.instagram.com/victory_pailippuram',
    `NOTE:Victory Club Member · Wing: ${member.wing || 'Club'} · Blood: ${Array.isArray(member.blood_group) ? member.blood_group[0] : (member.blood_group || 'Registered')} · Location: ${Array.isArray(member.location) ? member.location[0] : (member.location || 'Pailippuram')}`,
    'CATEGORIES:Victory Club,Community,Sports',
    'END:VCARD',
  ].filter(Boolean);

  const blob = new Blob([vCardLines.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${member.name.replace(/\s+/g, '_')}_Victory.vcf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MemberNfcProfilePage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.id ? decodeURIComponent(params.id) : '';

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [vCardDownloaded, setVCardDownloaded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Derive active profile URL for NFC sharing
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/victory/member/${memberId}`
    : `https://pailippuram.org/victory/member/${memberId}`;

  // Find member from local store or server API
  useEffect(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchMember() {
      setLoading(true);

      // Check in-code starter list first for fast instant response
      const matchedLocal = STARTER_VICTORY_MEMBERS.find(
        (m) =>
          String(m.id) === String(memberId) ||
          (m.name && m.name.toLowerCase().replace(/\s+/g, '-') === memberId.toLowerCase())
      );

      if (matchedLocal) {
        setMember(matchedLocal);
        setLoading(false);
      }

      // Check dynamic API
      try {
        const res = await fetch(`/api/admin/records?table=victory_members&id=${encodeURIComponent(memberId)}&_t=${Date.now()}`);
        const json = await res.json().catch(() => null);

        if (!isCancelled && json && json.success && json.data) {
          setMember(json.data);
          setLoading(false);
          return;
        }

        // If not found by single ID, fetch all to allow fuzzy search / name matching
        const allRes = await fetch(`/api/admin/records?table=victory_members&limit=200`);
        const allJson = await allRes.json().catch(() => null);

        if (!isCancelled && allJson && allJson.success && Array.isArray(allJson.data)) {
          const found = allJson.data.find(
            (m) =>
              String(m.id) === String(memberId) ||
              (m.name && m.name.toLowerCase().replace(/\s+/g, '-') === memberId.toLowerCase())
          );
          if (found) {
            setMember(found);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic member:', err);
      }

      if (!isCancelled) {
        setLoading(false);
      }
    }

    fetchMember();

    return () => {
      isCancelled = true;
    };
  }, [memberId]);

  const handleSaveContact = () => {
    if (!member) return;
    downloadVCard(member);
    setVCardDownloaded(true);
    setTimeout(() => setVCardDownloaded(false), 2500);
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(profileUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  // Safe display data
  const displayName = member?.name || 'Victory Club Member';
  const displayRole = member?.role || 'Committee Member';
  const displayRoleMl = member?.role_ml || 'വിക്ടറി ക്ലബ് അംഗം';
  const displayWing = member?.wing
    ? member.wing === 'executive'
      ? 'Executive Leadership'
      : member.wing === 'gcc'
      ? 'GCC Overseas Chapter'
      : member.wing === 'portfolios'
      ? member.portfolio || 'Key Portfolio'
      : member.wing === 'central'
      ? 'Central Committee'
      : member.wing
    : 'Victory Club';

  const avatarInitial = (displayName || 'V').charAt(0).toUpperCase();
  const whatsAppPhone = formatWhatsAppNumber(member?.phone);
  const rawBg = member?.blood_group;
  const bloodGroup = Array.isArray(rawBg) ? rawBg[0] : (rawBg || 'O+');
  const rawLoc = member?.location;
  const memberLocation = Array.isArray(rawLoc) ? rawLoc[0] : (rawLoc || (member?.wing === 'gcc' ? 'GCC' : 'Pailippuram, Kerala'));
  const instagramUrl = member?.link || 'https://www.instagram.com/victory_pailippuram';

  if (loading) {
    return (
      <div className="nfc-page-wrapper loading">
        <div className="nfc-card-shell">
          <div className="nfc-pulse-avatar" />
          <div className="nfc-pulse-line title" />
          <div className="nfc-pulse-line sub" />
          <div className="nfc-pulse-box" />
        </div>
        <style jsx>{`
          .nfc-page-wrapper {
            min-height: 100vh;
            background: #09090b;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .nfc-card-shell {
            width: 100%;
            max-width: 420px;
            background: #111217;
            border-radius: 28px;
            padding: 40px 24px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .nfc-pulse-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.08);
            animation: pulse 1.5s infinite ease-in-out;
          }
          .nfc-pulse-line {
            height: 18px;
            background: rgba(255, 255, 255, 0.06);
            border-radius: 999px;
            animation: pulse 1.5s infinite ease-in-out;
          }
          .nfc-pulse-line.title {
            width: 60%;
            height: 22px;
          }
          .nfc-pulse-line.sub {
            width: 40%;
          }
          .nfc-pulse-box {
            width: 100%;
            height: 120px;
            margin-top: 10px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.04);
            animation: pulse 1.5s infinite ease-in-out;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!member && !loading) {
    return (
      <div className="nfc-page-wrapper">
        <div className="nfc-card-shell error">
          <div className="nfc-error-badge">
            <UserCheck size={32} />
          </div>
          <h2 className="nfc-error-title">Member Profile Not Found</h2>
          <p className="nfc-error-desc">
            The NFC tag ID &ldquo;{memberId}&rdquo; is not currently linked to an active member record.
          </p>
          <div className="nfc-error-actions">
            <Link href="/victory" className="nfc-btn-gold">
              <ArrowLeft size={16} />
              <span>Back to Victory Roster</span>
            </Link>
            <Link href="/admin/victory" className="nfc-btn-secondary">
              Admin Member Management
            </Link>
          </div>
        </div>
        <style jsx>{`
          .nfc-page-wrapper {
            min-height: 100vh;
            background: #09090b;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .nfc-card-shell.error {
            width: 100%;
            max-width: 420px;
            background: #111217;
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 28px;
            padding: 40px 24px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .nfc-error-badge {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.12);
            color: #ef4444;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .nfc-error-title {
            color: #ffffff;
            font-size: 20px;
            font-weight: 700;
            margin: 0;
          }
          .nfc-error-desc {
            color: #9ca3af;
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
          }
          .nfc-error-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
            margin-top: 10px;
          }
          .nfc-btn-gold {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            font-weight: 600;
            padding: 12px;
            border-radius: 14px;
            text-decoration: none;
          }
          .nfc-btn-secondary {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            padding: 12px;
            border-radius: 14px;
            text-decoration: none;
            font-size: 13.5px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="nfc-page-root">
      {/* Background ambient luxury lighting */}
      <div className="nfc-glow-top" />
      <div className="nfc-glow-bottom" />

      <main className="nfc-container">
        {/* Top App Header / Bar */}
        <header className="nfc-top-bar">
          <Link href="/victory" className="nfc-back-link" title="Victory Club Directory">
            <ArrowLeft size={16} />
            <span>Victory Directory</span>
          </Link>
          <div className="nfc-bar-right">
            <button
              type="button"
              className="nfc-icon-pill"
              onClick={() => setShowQrModal(true)}
              title="Show In-Person QR Code"
              aria-label="Show QR Code"
            >
              <QrCode size={16} />
              <span>QR Card</span>
            </button>
            <button
              type="button"
              className="nfc-icon-pill"
              onClick={handleCopyLink}
              title="Copy Profile URL"
              aria-label="Copy Profile URL"
            >
              {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            </button>
          </div>
        </header>

        {/* Profile Card Shell */}
        <div className="nfc-profile-card">
          {/* Card Top Banner with Emblem */}
          <div className="nfc-card-banner">
            <div className="nfc-emblem-badge">
              <span className="nfc-emblem-v">V</span>
              <span className="nfc-emblem-text">VICTORY CLUB</span>
            </div>
            <span className="nfc-verified-pill">
              <ShieldCheck size={13} />
              <span>Verified</span>
            </span>
          </div>

          {/* Member Portrait */}
          <div className="nfc-avatar-container">
            <div className="nfc-avatar-halo">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={displayName}
                  className="nfc-avatar-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.nfc-avatar-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="nfc-avatar-fallback"
                style={{ display: member.photo_url ? 'none' : 'flex' }}
              >
                {avatarInitial}
              </div>
            </div>
          </div>

          {/* Member Identity Block */}
          <div className="nfc-identity-block">
            <h1 className="nfc-member-name">{displayName}</h1>
            <p className="nfc-member-role-ml">{displayRoleMl}</p>
            <div className="nfc-wing-pill">
              <Award size={13} />
              <span>{displayRole} · {displayWing}</span>
            </div>
          </div>

          {/* Emergency & Vital Information Bar */}
          <div className="nfc-vitals-strip">
            <div className="nfc-vital-item">
              <Droplet size={14} className="nfc-vital-icon blood" />
              <div className="nfc-vital-content">
                <span className="nfc-vital-label">BLOOD GROUP</span>
                <span className="nfc-vital-value">{bloodGroup}</span>
              </div>
            </div>
            <div className="nfc-vital-divider" />
            <div className="nfc-vital-item">
              <MapPin size={14} className="nfc-vital-icon location" />
              <div className="nfc-vital-content">
                <span className="nfc-vital-label">LOCATION</span>
                <span className="nfc-vital-value">{memberLocation}</span>
              </div>
            </div>
          </div>

          {/* Primary Call-to-Action: Save to Contacts (vCard) */}
          <div className="nfc-primary-cta-wrap">
            <button
              type="button"
              className={`nfc-vcard-btn ${vCardDownloaded ? 'downloaded' : ''}`}
              onClick={handleSaveContact}
              title="Download vCard and add to phone contacts"
            >
              <div className="nfc-vcard-btn-content">
                {vCardDownloaded ? <Check size={20} /> : <Download size={20} />}
                <div className="text-left">
                  <span className="nfc-vcard-main">
                    {vCardDownloaded ? 'Contact Saved (.vcf)!' : 'Save Contact to Phone'}
                  </span>
                  <span className="nfc-vcard-sub">One-tap sync to Apple &amp; Google Contacts</span>
                </div>
              </div>
            </button>
          </div>

          {/* Linktree Action Buttons */}
          <div className="nfc-links-stack">
            {/* WhatsApp Direct Chat */}
            {whatsAppPhone ? (
              <a
                href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(`Hi ${displayName}, connecting via your Victory Club NFC card.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="nfc-link-tile whatsapp"
              >
                <div className="nfc-tile-left">
                  <span className="nfc-tile-icon-box whatsapp">
                    <MessageCircle size={20} />
                  </span>
                  <div className="nfc-tile-texts">
                    <span className="nfc-tile-title">WhatsApp Message</span>
                    <span className="nfc-tile-desc">Instant direct chat with {displayName}</span>
                  </div>
                </div>
                <ExternalLink size={16} className="nfc-tile-arrow" />
              </a>
            ) : null}

            {/* Direct Phone Call */}
            {member.phone ? (
              <a
                href={`tel:${member.phone}`}
                className="nfc-link-tile phone"
              >
                <div className="nfc-tile-left">
                  <span className="nfc-tile-icon-box phone">
                    <Phone size={20} />
                  </span>
                  <div className="nfc-tile-texts">
                    <span className="nfc-tile-title">Direct Phone Call</span>
                    <span className="nfc-tile-desc">{member.phone}</span>
                  </div>
                </div>
                <ExternalLink size={16} className="nfc-tile-arrow" />
              </a>
            ) : null}

            {/* Instagram Profile */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nfc-link-tile instagram"
            >
              <div className="nfc-tile-left">
                <span className="nfc-tile-icon-box instagram">
                  <Globe size={20} />
                </span>
                <div className="nfc-tile-texts">
                  <span className="nfc-tile-title">Instagram &amp; Social</span>
                  <span className="nfc-tile-desc">Official Victory Club feed &amp; updates</span>
                </div>
              </div>
              <ExternalLink size={16} className="nfc-tile-arrow" />
            </a>

            {/* Victory Club Official Hub */}
            <Link href="/victory" className="nfc-link-tile portal">
              <div className="nfc-tile-left">
                <span className="nfc-tile-icon-box portal">
                  <Sparkles size={20} />
                </span>
                <div className="nfc-tile-texts">
                  <span className="nfc-tile-title">Victory Club Portal</span>
                  <span className="nfc-tile-desc">View full committee, sports &amp; programs</span>
                </div>
              </div>
              <ExternalLink size={16} className="nfc-tile-arrow" />
            </Link>
          </div>

          {/* Footer Card Signature */}
          <footer className="nfc-card-footer">
            <div className="nfc-footer-tag">
              <span>NFC DIGITAL IDENTITY</span>
              <span>·</span>
              <span>VICTORY ARTS &amp; SPORTS CLUB</span>
            </div>
            <p className="nfc-footer-sub">Pailippuram · Est. 1994 · Registered Community Body</p>
          </footer>
        </div>
      </main>

      {/* QR Code Modal for In-Person Sharing */}
      {showQrModal && (
        <NfcQrModal
          url={profileUrl}
          memberName={displayName}
          role={displayRole}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* Embedded High-Performance Styles */}
      <style jsx>{`
        .nfc-page-root {
          min-height: 100vh;
          background-color: #0b0d14;
          color: #ffffff;
          position: relative;
          overflow-x: hidden;
          padding: 16px 12px 40px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: system-ui, -apple-system, 'Anek Malayalam', sans-serif;
        }

        .nfc-glow-top {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 380px;
          height: 380px;
          background: #d4af37;
          border-radius: 50%;
          filter: blur(160px);
          opacity: 0.16;
          pointer-events: none;
          z-index: 0;
        }

        .nfc-glow-bottom {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 320px;
          height: 320px;
          background: #3b82f6;
          border-radius: 50%;
          filter: blur(180px);
          opacity: 0.12;
          pointer-events: none;
          z-index: 0;
        }

        .nfc-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .nfc-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 6px;
        }

        .nfc-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #d1d5db;
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
          transition: all 0.15s ease;
        }

        .nfc-back-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
        }

        .nfc-bar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nfc-icon-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #d4af37;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 999px;
          padding: 7px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .nfc-icon-pill:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: translateY(-1px);
        }

        .nfc-profile-card {
          background: #11131c;
          border: 1px solid rgba(212, 175, 55, 0.28);
          border-radius: 28px;
          padding: 24px 20px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(212, 175, 55, 0.08);
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }

        .nfc-card-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 14px;
        }

        .nfc-emblem-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nfc-emblem-v {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #09090b;
          border: 1.5px solid #d4af37;
          color: #d4af37;
          font-weight: 900;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nfc-emblem-text {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #d4af37;
        }

        .nfc-verified-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #10b981;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 999px;
          padding: 3px 8px;
        }

        .nfc-avatar-container {
          display: flex;
          justify-content: center;
          margin-top: -6px;
        }

        .nfc-avatar-halo {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          padding: 4px;
          background: linear-gradient(135deg, #f59e0b 0%, #d4af37 50%, #78350f 100%);
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
          position: relative;
        }

        .nfc-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          background: #181920;
          display: block;
        }

        .nfc-avatar-fallback {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #181920;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 38px;
          font-weight: 800;
          color: #d4af37;
        }

        .nfc-identity-block {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .nfc-member-name {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .nfc-member-role-ml {
          font-size: 14.5px;
          color: #c5a059;
          margin: 0;
          font-weight: 600;
        }

        .nfc-wing-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          color: #e5e7eb;
        }

        .nfc-vitals-strip {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 10px 14px;
        }

        .nfc-vital-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nfc-vital-icon {
          width: 28px;
          height: 28px;
          padding: 6px;
          border-radius: 8px;
        }

        .nfc-vital-icon.blood {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .nfc-vital-icon.location {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .nfc-vital-content {
          display: flex;
          flex-direction: column;
        }

        .nfc-vital-label {
          font-size: 9.5px;
          letter-spacing: 0.06em;
          color: #9ca3af;
          font-weight: 700;
        }

        .nfc-vital-value {
          font-size: 13.5px;
          font-weight: 700;
          color: #f3f4f6;
        }

        .nfc-vital-divider {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
        }

        .nfc-primary-cta-wrap {
          width: 100%;
        }

        .nfc-vcard-btn {
          width: 100%;
          min-height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: none;
          color: #000000;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);
          transition: all 0.18s ease;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nfc-vcard-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        .nfc-vcard-btn:active {
          transform: scale(0.98);
        }

        .nfc-vcard-btn.downloaded {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
        }

        .nfc-vcard-btn-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nfc-vcard-main {
          display: block;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.2;
        }

        .nfc-vcard-sub {
          display: block;
          font-size: 11px;
          opacity: 0.85;
          margin-top: 1px;
        }

        .nfc-links-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .nfc-link-tile {
          min-height: 54px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.16s ease;
        }

        .nfc-link-tile:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(212, 175, 55, 0.35);
          transform: translateY(-1px);
        }

        .nfc-link-tile:active {
          transform: scale(0.99);
        }

        .nfc-tile-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .nfc-tile-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nfc-tile-icon-box.whatsapp {
          background: rgba(37, 211, 102, 0.15);
          color: #25d366;
          border: 1px solid rgba(37, 211, 102, 0.3);
        }

        .nfc-tile-icon-box.phone {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .nfc-tile-icon-box.instagram {
          background: rgba(236, 72, 153, 0.15);
          color: #f472b6;
          border: 1px solid rgba(236, 72, 153, 0.3);
        }

        .nfc-tile-icon-box.portal {
          background: rgba(212, 175, 55, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .nfc-tile-texts {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .nfc-tile-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
        }

        .nfc-tile-desc {
          font-size: 11.5px;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nfc-tile-arrow {
          color: #6b7280;
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }

        .nfc-link-tile:hover .nfc-tile-arrow {
          color: #d4af37;
          transform: translateX(2px);
        }

        .nfc-card-footer {
          margin-top: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nfc-footer-tag {
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #d4af37;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .nfc-footer-sub {
          font-size: 11px;
          color: #6b7280;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
