'use client';
// Normalized client entry for the Victory page; hide global footer via a body class.
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useRows } from '../../lib/useRows';
import { STARTER_VICTORY_MEMBERS } from '../../lib/mockStore';

const DEFAULT_PROFILE_LINK = 'https://www.instagram.com/victory_pailippuram';

export default function VictoryClubLandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);

  // Scroll to top immediately when landing on /victory
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    // Check if logged-in user is admin
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        if (userRes?.user) {
          const { data: ok } = await supabase.rpc('is_admin');
          setIsAdmin(Boolean(ok));
        }
      } catch {
        // non-blocking
      }
    })();
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/');
    }
  };

   // Hide site-wide footer while this page is mounted
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('hide-global-footer');
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('hide-global-footer');
      }
    };
  }, []);

  // Fetch committee members live from database
  const { rows, loading } = useRows(
    (s) => s.from('victory_members').select('*').eq('status', 'approved').order('display_order', { ascending: true }),
    []
  );

  // Process data from DB or fallback to starter roster
  const committeeData = useMemo(() => {
    const list = rows && rows.length > 0 ? rows : STARTER_VICTORY_MEMBERS;

    const executive = list.filter((m) => m.wing === 'executive');

    // Portfolio groups
    const portfolioGroups = [
      {
        role: 'Finance Controllers',
        roleMl: 'ഫിനാൻസ് കൺട്രോളേഴ്സ്',
        icon: '💼',
        members: list.filter((m) => m.wing === 'portfolios' && m.portfolio?.toLowerCase().includes('finance')),
      },
      {
        role: 'Sports Managers',
        roleMl: 'സ്പോർട്സ് മാനേജ്‌മെന്റ്',
        icon: '⚽',
        members: list.filter((m) => m.wing === 'portfolios' && m.portfolio?.toLowerCase().includes('sport')),
      },
      {
        role: 'Media & Communications',
        roleMl: 'മീഡിയ & പി.ആർ',
        icon: '📸',
        members: list.filter((m) => m.wing === 'portfolios' && m.portfolio?.toLowerCase().includes('media')),
      },
      {
        role: 'Charity & Social Welfare',
        roleMl: 'ചാരിറ്റി & ജനസേവനം',
        icon: '🤝',
        members: list.filter((m) => m.wing === 'portfolios' && m.portfolio?.toLowerCase().includes('charity')),
      },
    ];

    // Other portfolio members if any custom ones exist
    const categorizedIds = new Set(portfolioGroups.flatMap((g) => g.members.map((m) => m.id)));
    const otherPortfolios = list.filter((m) => m.wing === 'portfolios' && !categorizedIds.has(m.id));
    if (otherPortfolios.length > 0) {
      portfolioGroups.push({
        role: 'Other Portfolios',
        roleMl: 'മറ്റ് വകുപ്പുകൾ',
        icon: '⭐',
        members: otherPortfolios,
      });
    }

    const gcc = list.filter((m) => m.wing === 'gcc');
    const central = list.filter((m) => m.wing === 'central');

    return {
      term: '2026–27',
      totalCount: executive.length + gcc.length + central.length + list.filter((m) => m.wing === 'portfolios').length,
      executive,
      portfolios: portfolioGroups.filter((g) => g.members.length > 0),
      gcc,
      central,
    };
  }, [rows]);

  return (
    <div className="victory-page">
      <style>{`
        .victory-page {
          background-color: #08080a;
          color: #ffffff;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          font-family: 'Anek Malayalam', system-ui, -apple-system, sans-serif;
        }

        /* Ambient Lighting */
        .victory-glow-top {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 540px;
          height: 380px;
          background: radial-gradient(circle, rgba(197, 160, 89, 0.22) 0%, rgba(146, 114, 56, 0.08) 50%, transparent 70%);
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .victory-glow-mid {
          position: absolute;
          top: 600px;
          right: -100px;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(197, 160, 89, 0.12) 0%, transparent 70%);
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }

        /* Top Nav */
        .victory-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          position: relative;
          z-index: 30;
          max-width: 640px;
          width: 100%;
          margin: 0 auto;
          gap: 10px;
        }

        .victory-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(197, 160, 89, 0.28);
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .victory-btn:hover {
          background: rgba(197, 160, 89, 0.18);
          border-color: #dfbd69;
          transform: translateY(-1px);
        }

        .victory-btn-gold {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          font-size: 12.5px;
          font-weight: 700;
          color: #08080a !important;
          background: linear-gradient(135deg, #dfbd69 0%, #c5a059 100%);
          border: 1px solid #dfbd69;
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none !important;
          box-shadow: 0 4px 14px rgba(197, 160, 89, 0.35);
          transition: all 0.2s ease;
        }

        .victory-btn-gold:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(197, 160, 89, 0.5);
          background: #ffffff;
          color: #08080a !important;
        }

        /* Main Container */
        .victory-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 20px 48px;
          max-width: 640px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        /* Hero Shield Branding */
        .victory-hero-box {
          text-align: center;
          margin-bottom: 28px;
          width: 100%;
        }

        .victory-logo-wrap {
          width: 130px;
          height: 130px;
          margin: 0 auto 18px;
          border-radius: 50%;
          background: #0f0f13;
          padding: 8px;
          border: 2px solid rgba(197, 160, 89, 0.45);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 45px rgba(197, 160, 89, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .victory-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        .victory-title {
          font-family: 'Gayathri', 'Anek Malayalam', sans-serif;
          font-size: 38px;
          font-weight: 800;
          line-height: 1.05;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #ffffff 30%, #dfbd69 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .victory-subtitle {
          font-size: 19px;
          font-weight: 600;
          color: #c5a059;
          margin: 0 0 14px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .victory-estd-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border: 1px solid rgba(197, 160, 89, 0.35);
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #dfbd69;
          background: rgba(197, 160, 89, 0.08);
          backdrop-filter: blur(8px);
        }

        /* Committee Master Card */
        .committee-master {
          width: 100%;
          background: linear-gradient(180deg, rgba(22, 22, 26, 0.85) 0%, rgba(13, 13, 16, 0.95) 100%);
          border: 1.5px solid rgba(197, 160, 89, 0.3);
          border-radius: 28px;
          padding: 24px 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .committee-master::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #c5a059, #dfbd69, transparent);
        }

        .committee-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .committee-title {
          font-family: 'Gayathri', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
          margin: 0;
        }

        .committee-actions-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .committee-term-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          background: #c5a059;
          color: #09090b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 14px rgba(197, 160, 89, 0.35);
        }

        /* Segmented Tabs */
        .committee-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 18px;
          scrollbar-width: none;
        }

        .committee-tabs::-webkit-scrollbar {
          display: none;
        }

        .committee-tab-btn {
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 700;
          border: 1px solid rgba(197, 160, 89, 0.22);
          background: rgba(255, 255, 255, 0.04);
          color: #94a3b8;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .committee-tab-btn.active {
          background: #c5a059;
          color: #09090b;
          border-color: #c5a059;
          box-shadow: 0 2px 8px rgba(197, 160, 89, 0.3);
        }

        /* Section Headings inside Master */
        .section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #dfbd69;
          margin: 20px 0 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(197, 160, 89, 0.15);
        }

        /* Executive Leaders Grid */
        .exec-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .exec-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(197, 160, 89, 0.25);
          border-radius: 20px;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          text-decoration: none !important;
          color: inherit;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
          cursor: pointer;
        }

        .exec-card:hover {
          transform: translateY(-2px);
          border-color: rgba(223, 189, 105, 0.6);
          background: rgba(197, 160, 89, 0.08);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 18px rgba(197, 160, 89, 0.15);
        }

        /* Executive Avatar with Photo Support */
        .exec-avatar-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #24221b 0%, #0d0d10 100%);
          border: 2px solid #dfbd69;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4), inset 0 0 12px rgba(197, 160, 89, 0.25);
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
        }

        .exec-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .exec-avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 800;
          color: #dfbd69;
        }

        .exec-role {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #dfbd69;
          margin-bottom: 3px;
        }

        .exec-name {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .exec-link-hint {
          font-size: 11px;
          color: #e5c98f;
          opacity: 0.8;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          margin-top: 5px;
        }

        .exec-ml {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Portfolio Cards Grid */
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .portfolio-card {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: border-color 0.15s ease;
        }

        .portfolio-card:hover {
          border-color: rgba(197, 160, 89, 0.35);
        }

        .portfolio-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .portfolio-role {
          font-size: 13.5px;
          font-weight: 700;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .portfolio-role-ml {
          font-size: 11.5px;
          color: #dfbd69;
          font-weight: 600;
        }

        .portfolio-members {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }

        .member-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 12px;
          background: rgba(197, 160, 89, 0.09);
          border: 1px solid rgba(197, 160, 89, 0.22);
          color: #ffffff !important;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none !important;
          transition: all 0.18s ease;
          cursor: pointer;
        }

        .member-badge:hover {
          background: rgba(197, 160, 89, 0.22);
          border-color: #dfbd69;
          transform: translateY(-1px);
        }

        .member-mini-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #dfbd69;
          flex-shrink: 0;
        }

        .member-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #dfbd69;
          flex-shrink: 0;
        }

        /* Member List Pill Roster (GCC & Central) */
        .roster-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
          gap: 8px;
          margin-bottom: 8px;
        }

        .roster-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none !important;
          color: inherit;
          transition: all 0.18s ease;
          cursor: pointer;
        }

        .roster-item:hover {
          background: rgba(197, 160, 89, 0.12);
          border-color: rgba(197, 160, 89, 0.45);
          transform: translateY(-1px);
        }

        .roster-num {
          font-size: 10.5px;
          font-weight: 800;
          color: #dfbd69;
          font-variant-numeric: tabular-nums;
          background: rgba(197, 160, 89, 0.15);
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .roster-avatar-img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(197, 160, 89, 0.6);
          flex-shrink: 0;
        }

        .roster-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Instagram Channel Button */
        .insta-channel-bar {
          width: 100%;
          margin-top: 4px;
          margin-bottom: 24px;
        }

        .insta-channel-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 20px;
          border-radius: 14px;
          background: #121215;
          color: #ffffff !important;
          border: 1.5px solid #c5a059;
          font-weight: 700;
          font-size: 14.5px;
          text-decoration: none !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 20px rgba(197, 160, 89, 0.18);
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .insta-channel-link:hover {
          transform: translateY(-2px);
          border-color: #dfbd69;
          box-shadow: 0 12px 30px rgba(197, 160, 89, 0.3);
          background: #1a1a20;
        }

        /* Legacy Info Box */
        .legacy-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          width: 100%;
          margin-bottom: 24px;
        }

        .legacy-text {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .victory-page-footer {
          padding: 24px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
          color: #64748b;
          font-size: 13px;
          width: 100%;
          position: relative;
          z-index: 10;
        }

        .victory-page-footer a {
          color: #dfbd69;
          text-decoration: underline;
        }
      `}</style>

      {/* Atmospheric lighting */}
      <div className="victory-glow-top" />
      <div className="victory-glow-mid" />

      {/* Top Bar */}
      <header className="victory-nav">
        <button type="button" onClick={handleBack} className="victory-btn" aria-label="Go back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Go Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href="/admin/victory"
            className="victory-btn-gold"
            title="Edit committee member photos and details (Admin)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Committee
          </Link>

          <Link href="/" className="victory-btn" title="Back to Directory Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="victory-main">
        {/* Hero Section */}
        <div className="victory-hero-box">
          <div className="victory-logo-wrap">
            <img
              src="/victory-logo.png"
              alt="Victory Arts & Sports Club"
              className="victory-logo-img"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/400x400/0f0f13/dfbd69?text=Victory+Club';
              }}
            />
          </div>

          <h1 className="victory-title">Victory</h1>
          <div className="victory-subtitle">Arts &amp; Sports Club</div>

          <div className="victory-estd-pill">
            <span>⚽</span> ESTD 1994 · PAILIPPURAM
          </div>
        </div>

        {/* 2026-27 Committee Section */}
        <section className="committee-master" id="committee">
          <div className="committee-head">
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: '#dfbd69', textTransform: 'uppercase' }}>
                Executive Leadership Roster
              </span>
              <h2 className="committee-title">Official Committee</h2>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>ഭാരവാഹികൾ &amp; ഉപസമിതികൾ 2026–27</span>
            </div>
            <div className="committee-actions-wrap">
              <div className="committee-term-badge">
                <span>★</span> 2026–27 TERM
              </div>
            </div>
          </div>

          // {/* Segmented Filter Tabs */}
          // <div className="committee-tabs">
          //   <button
          //     type="button"
          //     className={`committee-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          //     onClick={() => setActiveTab('all')}
          //   >
          //     All Wings ({committeeData.totalCount})
          //   </button>
          //   <button
          //     type="button"
          //     className={`committee-tab-btn ${activeTab === 'executive' ? 'active' : ''}`}
          //     onClick={() => setActiveTab('executive')}
          //   >
          //     Executive ({committeeData.executive.length})
          //   </button>
          //   <button
          //     type="button"
          //     className={`committee-tab-btn ${activeTab === 'portfolios' ? 'active' : ''}`}
          //     onClick={() => setActiveTab('portfolios')}
          //   >
          //     Portfolios ({committeeData.portfolios.reduce((acc, p) => acc + p.members.length, 0)})
          //   </button>
          //   <button
          //     type="button"
          //     className={`committee-tab-btn ${activeTab === 'gcc' ? 'active' : ''}`}
          //     onClick={() => setActiveTab('gcc')}
          //   >
          //     GCC Wing ({committeeData.gcc.length})
          //   </button>
          //   <button
          //     type="button"
          //     className={`committee-tab-btn ${activeTab === 'central' ? 'active' : ''}`}
          //     onClick={() => setActiveTab('central')}
          //   >
          //     Central ({committeeData.central.length})
          //   </button>
          // </div>

          {/* 1. EXECUTIVE LEADERS (With Photos) */}
          {(activeTab === 'all' || activeTab === 'executive') && committeeData.executive.length > 0 && (
            <>
              <div className="section-label">
                <span>👑</span> Executive Officers · leadership
              </div>
              <div className="exec-grid">
                {committeeData.executive.map((ex) => (
                  <a
                    key={ex.id || ex.role}
                    href={ex.link || DEFAULT_PROFILE_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="exec-card"
                    title={`Connect with ${ex.name} on Instagram`}
                  >
                    <div className="exec-avatar-wrap">
                      {ex.photo_url ? (
                        <img
                          src={ex.photo_url}
                          alt={ex.name}
                          className="exec-avatar-img"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="exec-avatar-fallback"
                        style={{ display: ex.photo_url ? 'none' : 'flex' }}
                      >
                        {ex.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <span className="exec-role">{ex.role}</span>
                    <span className="exec-name">
                      {ex.name}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dfbd69" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </span>
                    <span className="exec-ml">{ex.role_ml || ex.roleMl || ''}</span>
                    <span className="exec-link-hint">@victory_pailippuram</span>
                  </a>
                ))}
              </div>
            </>
          )}

          {/* 2. CORE PORTFOLIOS (With Photos) */}
          {(activeTab === 'all' || activeTab === 'portfolios') && committeeData.portfolios.length > 0 && (
            <>
              <div className="section-label">
                <span>⚡</span> Key Portfolios · വകുപ്പ് ചുമതലകൾ
              </div>
              <div className="portfolio-grid">
                {committeeData.portfolios.map((p) => (
                  <div key={p.role} className="portfolio-card">
                    <div className="portfolio-header">
                      <span className="portfolio-role">
                        <span>{p.icon}</span> {p.role}
                      </span>
                      <span className="portfolio-role-ml">{p.roleMl}</span>
                    </div>
                    <div className="portfolio-members">
                      {p.members.map((m) => (
                        <a
                          key={m.id || m.name}
                          href={m.link || DEFAULT_PROFILE_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="member-badge"
                          title={`Connect with ${m.name} on Instagram`}
                        >
                          {m.photo_url ? (
                            <img
                              src={m.photo_url}
                              alt={m.name}
                              className="member-mini-avatar"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const dot = e.currentTarget.nextElementSibling;
                                if (dot) dot.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span
                            className="member-dot"
                            style={{ display: m.photo_url ? 'none' : 'block' }}
                          />
                          <span>{m.name}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dfbd69" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 3. GCC WING (With Photos) */}
          {(activeTab === 'all' || activeTab === 'gcc') && committeeData.gcc.length > 0 && (
            <>
              <div className="section-label">
                <span>🌍</span> GCC Wing · പ്രവാസി ചാപ്റ്റർ ({committeeData.gcc.length})
              </div>
              <div className="roster-grid">
                {committeeData.gcc.map((m, idx) => (
                  <a
                    key={m.id || m.name}
                    href={m.link || DEFAULT_PROFILE_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="roster-item"
                    title={`Connect with ${m.name} on Instagram`}
                  >
                    <span className="roster-num">{String(m.display_order || idx + 1).padStart(2, '0')}</span>
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.name}
                        className="roster-avatar-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span className="roster-name">{m.name}</span>
                  </a>
                ))}
              </div>
            </>
          )}

          {/* 4. CENTRAL COMMITTEE (With Photos) */}
          {(activeTab === 'all' || activeTab === 'central') && committeeData.central.length > 0 && (
            <>
              <div className="section-label" style={{ marginTop: 24 }}>
                <span>🏛️</span> Central Committee · സെൻട്രൽ കമ്മിറ്റി ({committeeData.central.length})
              </div>
              <div className="roster-grid">
                {committeeData.central.map((m, idx) => (
                  <a
                    key={m.id || m.name}
                    href={m.link || DEFAULT_PROFILE_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="roster-item"
                    title={`Connect with ${m.name} on Instagram`}
                  >
                    <span className="roster-num">{String(m.display_order || idx + 1).padStart(2, '0')}</span>
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.name}
                        className="roster-avatar-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span className="roster-name">{m.name}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Instagram Channel Bar */}
        <div className="insta-channel-bar">
          <a
            href={DEFAULT_PROFILE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="insta-channel-link"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.0[...]
            </svg>
            Follow @victory_pailippuram on Instagram
          </a>
        </div>

        {/* Club Legacy & Heritage */}
        <div className="legacy-box">
          <p style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
            Over 30 Years of Community Excellence
          </p>
          <p className="legacy-text">
            Situated in the heart of <strong style={{ color: '#ffffff' }}>Pailippuram, Palakkad district, Kerala</strong>.
            Founded in 1994, Victory Arts &amp; Sports Club has fostered athletic talent, organized premier regional tournaments, and led charitable community support for three decades.
          </p>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="victory-page-footer">
        <p>&copy; 2026 Victory Arts &amp; Sports Club. All rights reserved.</p>
        <p style={{ marginTop: 4, fontSize: 12 }}>Pailippuram, Palakkad Dt, Kerala · A Community Initiative</p>
      </footer>
    </div>
  );
}
