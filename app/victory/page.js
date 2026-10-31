'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Trophy,
  Coins,
  Camera,
  HeartHandshake,
  Globe2,
  Users,
  Phone,
  ArrowLeft,
  Home,
  Sparkles,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { STARTER_VICTORY_MEMBERS, memoryStore } from '../../lib/mockStore';

const PORTFOLIO_CONFIG = {
  'Sports Managers': {
    title: 'Sports Management',
    title_ml: 'സ്പോർട്സ് മാനേജ്‌മെന്റ്',
    icon: Trophy,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    description: 'Football tournaments, athletic training, youth squads, and sports meet logistics',
  },
  'Finance Controllers': {
    title: 'Finance Controllers',
    title_ml: 'ഫിനാൻസ് കൺട്രോളേഴ്സ്',
    icon: Coins,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    description: 'Club treasury, budget allocations, sponsorships, and transparent audit operations',
  },
  'Media & Communications': {
    title: 'Media & Communications',
    title_ml: 'മീഡിയ & പി.ആർ',
    icon: Camera,
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    description: 'Social media updates, match broadcasts, press releases, and creative posters',
  },
  'Charity & Social Welfare': {
    title: 'Charity & Social Welfare',
    title_ml: 'ചാരിറ്റി & ജനസേവനം',
    icon: HeartHandshake,
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
    description: 'Community medical aid, distress relief, village welfare, and volunteering drives',
  },
};

export default function VictoryClubLandingPage() {
  const router = useRouter();

  // 1. Initialize with in-code records so the full committee renders immediately
  const [members, setMembers] = useState(STARTER_VICTORY_MEMBERS);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Scroll to top on first mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  // 2. Fetch live records from database, with multi-layer fallback & instant sync
  const loadVictoryMembers = useCallback(async () => {
    // Layer 1: Internal records API route (server-side, service-role backed, zero CORS/RLS issues)
    try {
      setLoadingMembers(true);
      const res = await fetch(`/api/admin/records?table=victory_members&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
      });
      const json = await res.json().catch(() => null);
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setMembers(json.data);
        return;
      }
    } catch (apiErr) {
      console.warn('[Victory] Internal API query fallback:', apiErr);
    }

    // Layer 2: Direct Supabase client query
    try {
      const { data, error } = await supabase
        .from('victory_members')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        setMembers(data);
        return;
      }
    } catch (sbErr) {
      console.warn('[Victory] Supabase query fallback:', sbErr);
    }

    // Layer 3: Client memoryStore / localStorage fallback
    try {
      const local = memoryStore.getTable('victory_members');
      if (Array.isArray(local) && local.length > 0) {
        setMembers(local);
      }
    } catch {
      // retain in-memory starter
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // Fetch immediately on mount
  useEffect(() => {
    loadVictoryMembers();
  }, [loadVictoryMembers]);

  // Re-fetch automatically when window gains focus or document becomes visible (e.g. after uploading photos in admin panel)
  useEffect(() => {
    function onFocus() {
      loadVictoryMembers();
    }
    function onVisibility() {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadVictoryMembers();
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }
  }, [loadVictoryMembers]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/');
    }
  };

  // Filter approved members
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.status !== 'hidden');
  }, [members]);

  // Pre-categorize all members by wing
  const executiveMembers = useMemo(() => {
    return activeMembers
      .filter((m) => m.wing === 'executive')
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [activeMembers]);

  const portfolioMembers = useMemo(() => {
    return activeMembers
      .filter((m) => m.wing === 'portfolios')
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [activeMembers]);

  // Group portfolio members by their department
  const portfolioGroups = useMemo(() => {
    const groups = {};
    // Pre-seed known portfolios in desired order
    Object.keys(PORTFOLIO_CONFIG).forEach((key) => {
      groups[key] = [];
    });

    for (const m of portfolioMembers) {
      const key = m.portfolio || 'General Portfolio';
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return groups;
  }, [portfolioMembers]);

  const gccMembers = useMemo(() => {
    return activeMembers
      .filter((m) => m.wing === 'gcc')
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [activeMembers]);

  const centralMembers = useMemo(() => {
    return activeMembers
      .filter((m) => m.wing === 'central')
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [activeMembers]);

  return (
    <div className="victory-page">
      <style>{`
        .victory-page {
          background-color: #09090b;
          color: #ffffff;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          font-family: 'Anek Malayalam', system-ui, -apple-system, sans-serif;
        }

        .victory-glow-1 {
          position: absolute;
          top: -60px;
          left: 15%;
          width: 380px;
          height: 380px;
          background: #c5a059;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.22;
          pointer-events: none;
          z-index: 0;
        }

        .victory-glow-2 {
          position: absolute;
          top: 140px;
          right: 8%;
          width: 340px;
          height: 340px;
          background: #927238;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.18;
          pointer-events: none;
          z-index: 0;
        }

        .victory-glow-3 {
          position: absolute;
          bottom: 120px;
          left: 25%;
          width: 400px;
          height: 400px;
          background: #e5c98f;
          border-radius: 50%;
          filter: blur(160px);
          opacity: 0.14;
          pointer-events: none;
          z-index: 0;
        }

        .victory-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          position: relative;
          z-index: 30;
          max-width: 760px;
          width: 100%;
          margin: 0 auto;
        }

        .victory-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(197, 160, 89, 0.35);
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.18s ease;
        }

        .victory-btn:hover {
          background: rgba(197, 160, 89, 0.22);
          border-color: #e5c98f;
          transform: translateY(-1px);
        }

        .victory-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 6px 16px 48px;
          max-width: 760px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .victory-hero {
          text-align: center;
          margin-bottom: 24px;
          width: 100%;
        }

        .victory-logo-wrap {
          width: 140px;
          height: 140px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: #ffffff;
          padding: 10px;
          border: 2px solid rgba(197, 160, 89, 0.55);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65), 0 0 30px rgba(197, 160, 89, 0.25);
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
          font-size: 34px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 4px;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .victory-subtitle {
          font-size: 20px;
          font-weight: 700;
          color: #e5c98f;
          margin: 0 0 14px;
          letter-spacing: 0.02em;
        }

        .victory-estd-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 16px;
          border: 1px solid rgba(197, 160, 89, 0.45);
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #e5c98f;
          background: rgba(197, 160, 89, 0.1);
          backdrop-filter: blur(8px);
          margin-bottom: 16px;
        }

        .victory-card {
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(197, 160, 89, 0.2);
          border-radius: 20px;
          padding: 18px 20px;
          margin-bottom: 24px;
          backdrop-filter: blur(12px);
          text-align: center;
          width: 100%;
        }

        .victory-lead {
          font-size: 15px;
          color: #f1f5f9;
          line-height: 1.5;
          margin: 0 0 8px;
        }

        .victory-text {
          font-size: 13.5px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
        }

        /* Committee Master Wrap */
        .committee-section {
          width: 100%;
          margin-bottom: 32px;
        }

        .committee-header {
          text-align: center;
          margin-bottom: 18px;
        }

        .committee-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 999px;
          background: rgba(197, 160, 89, 0.12);
          border: 1px solid rgba(197, 160, 89, 0.35);
          font-size: 11.5px;
          font-weight: 700;
          color: #e5c98f;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .committee-title {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 6px;
          color: #ffffff;
        }

        .committee-sub {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }

        /* Section Block Styling */
        .wing-group-block {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(197, 160, 89, 0.2);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 22px;
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
        }

        .wing-group-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .wing-group-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .wing-group-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .wing-group-title {
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }

        .wing-group-title-ml {
          font-size: 14px;
          color: #e5c98f;
          font-weight: 600;
        }

        .wing-group-desc {
          font-size: 12px;
          color: #94a3b8;
          margin: 2px 0 0;
        }

        .wing-badge-count {
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(197, 160, 89, 0.15);
          color: #e5c98f;
          border: 1px solid rgba(197, 160, 89, 0.3);
          white-space: nowrap;
        }

        /* 1. Executive Podium Grid */
        .executive-podium {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          width: 100%;
        }

        .exec-card {
          background: linear-gradient(145deg, rgba(30, 27, 20, 0.7) 0%, rgba(18, 18, 20, 0.8) 100%);
          border: 1.5px solid rgba(197, 160, 89, 0.45);
          border-radius: 18px;
          padding: 16px;
          text-align: center;
          position: relative;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 20px rgba(197, 160, 89, 0.1);
          transition: transform 0.18s ease, border-color 0.18s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .exec-card:hover {
          transform: translateY(-3px);
          border-color: #e5c98f;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(197, 160, 89, 0.25);
        }

        .exec-badge-ribbon {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(197, 160, 89, 0.2);
          color: #e5c98f;
          border: 1px solid rgba(197, 160, 89, 0.35);
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .exec-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3d321d 0%, #1a1813 100%);
          border: 2px solid #e5c98f;
          box-shadow: 0 0 16px rgba(197, 160, 89, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 800;
          color: #e5c98f;
          margin-bottom: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .exec-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .exec-name {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 2px;
        }

        .exec-role-ml {
          font-size: 13.5px;
          font-weight: 700;
          color: #e5c98f;
          margin: 0 0 2px;
        }

        .exec-role-en {
          font-size: 11.5px;
          color: #94a3b8;
          font-weight: 500;
          margin: 0 0 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .exec-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }

        /* 2. Department Portfolio Sub-Sections */
        .dept-cluster {
          margin-bottom: 18px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 14px;
        }

        .dept-cluster:last-child {
          margin-bottom: 0;
        }

        .dept-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
        }

        .dept-title-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dept-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .dept-title-ml {
          font-size: 13px;
          color: #94a3b8;
        }

        .dept-members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px;
        }

        /* Standard Member Card */
        .compact-member-card {
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(197, 160, 89, 0.18);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.16s ease;
        }

        .compact-member-card:hover {
          transform: translateY(-2px);
          border-color: rgba(197, 160, 89, 0.5);
          background: rgba(255, 255, 255, 0.065);
        }

        .card-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #272216 0%, #151411 100%);
          border: 1.5px solid #c5a059;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 700;
          color: #e5c98f;
          flex-shrink: 0;
          overflow: hidden;
        }

        .card-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-details {
          flex: 1;
          min-width: 0;
        }

        .card-name {
          font-size: 14.5px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-role-line {
          font-size: 12px;
          color: #e5c98f;
          font-weight: 600;
          margin: 0;
          line-height: 1.25;
        }

        .card-subrole {
          font-size: 11px;
          color: #94a3b8;
          margin: 1px 0 0;
        }

        .card-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .icon-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(197, 160, 89, 0.28);
          color: #e5c98f;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .icon-btn:hover {
          background: rgba(197, 160, 89, 0.25);
          border-color: #e5c98f;
          color: #ffffff;
          transform: scale(1.08);
        }

        /* 3. GCC Wing Chapter & Central Council Grid */
        .roster-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 10px;
        }

        .roster-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(197, 160, 89, 0.18);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.16s ease;
        }

        .roster-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(197, 160, 89, 0.45);
        }

        .roster-avatar {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #272216 0%, #151411 100%);
          border: 1.5px solid #c5a059;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          position: relative;
        }

        .roster-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .roster-index {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(197, 160, 89, 0.15);
          color: #e5c98f;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: inherit;
          font-weight: inherit;
          color: inherit;
        }

        .roster-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          flex: 1;
        }

        .roster-role-tag {
          font-size: 10.5px;
          color: #94a3b8;
          margin: 0;
        }

        /* Connect box */
        .victory-connect-box {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 28px;
          width: 100%;
          text-align: center;
        }

        .victory-connect-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #ffffff;
        }

        .victory-connect-sub {
          font-size: 13.5px;
          color: #94a3b8;
          margin-bottom: 18px;
        }

        .victory-insta-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          border-radius: 999px;
          background: #121212;
          border: 1.5px solid #c5a059;
          color: #ffffff !important;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(197, 160, 89, 0.2);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .victory-insta-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(197, 160, 89, 0.35);
          background: #1b1b1e;
          border-color: #e5c98f;
        }

        .victory-page-footer {
          padding: 24px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
          color: #8b8882;
          font-size: 12.5px;
          position: relative;
          z-index: 10;
        }

        @media (max-width: 640px) {
          .victory-main {
            padding: 4px 12px 40px;
          }
          .executive-podium {
            grid-template-columns: 1fr;
          }
          .dept-members-grid {
            grid-template-columns: 1fr;
          }
          .roster-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Atmospheric lighting */}
      <div className="victory-glow-1" />
      <div className="victory-glow-2" />
      <div className="victory-glow-3" />

      {/* Top Navigation */}
      <header className="victory-nav">
        <button
          type="button"
          onClick={handleBack}
          className="victory-btn"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        <Link href="/" className="victory-btn" title="Back to Directory Home">
          <Home size={16} />
          Home Directory
        </Link>
      </header>

      {/* Main Container */}
      <main className="victory-main">
        {/* Hero */}
        <section className="victory-hero">
          <div className="victory-logo-wrap">
            <img
              src="/victory-logo.png"
              alt="Victory Arts & Sports Club"
              className="victory-logo-img"
              onError={(e) => {
                e.currentTarget.src =
                  'https://placehold.co/400x400/ffffff/000000?text=Victory+Club';
              }}
            />
          </div>

          <h1 className="victory-title">Victory</h1>
          <div className="victory-subtitle">Arts &amp; Sports Club</div>

          <div className="victory-estd-badge">
            <Sparkles size={13} />
            ESTD 1994 · PAILIPPURAM
          </div>

          <div className="victory-card">
            <p className="victory-lead">
              Situated in the heart of{' '}
              <strong style={{ color: '#ffffff' }}>Pailippuram, Palakkad district, Kerala</strong>.
            </p>
            <p className="victory-text">
              For over 25 years, Victory has been a cornerstone of cultural and athletic excellence in
              our community. Since our founding in 1994, we have remained dedicated to nurturing talent,
              fostering community spirit, and upholding a lasting legacy in both sports and social
              service.
            </p>
          </div>
        </section>

        {/* Structured Committee Section */}
        <section className="committee-section">
          <div className="committee-header">
            <div className="committee-pill">
              <Users size={13} />
              Club Leadership &amp; Committee
            </div>
            <h2 className="committee-title">ഭാരവാഹികളും സമിതി അംഗങ്ങളും</h2>
            <p className="committee-sub">
              Organized leadership structure driving sports, welfare, and community initiatives
            </p>
          </div>

          {/* SECTION 1: EXECUTIVE LEADERSHIP PODIUM */}
          <div className="wing-group-block">
                  <div className="wing-group-header">
                    <div className="wing-group-title-wrap">
                      <div
                        className="wing-group-icon"
                        style={{
                          background: 'rgba(197, 160, 89, 0.15)',
                          color: '#e5c98f',
                          border: '1px solid rgba(197, 160, 89, 0.35)',
                        }}
                      >
                        <Crown size={18} />
                      </div>
                      <div>
                        <h3 className="wing-group-title">
                          Executive Leadership
                          <span className="wing-group-title-ml">ക്ലബ്ബ് നേതൃത്വം</span>
                        </h3>
                        <p className="wing-group-desc">
                          Top elected governing body overseeing overall club governance and administration
                        </p>
                      </div>
                    </div>
                    <span className="wing-badge-count">{executiveMembers.length} Leaders</span>
                  </div>

                  <div className="executive-podium">
                    {executiveMembers.map((m, idx) => {
                      const initial = (m.name || 'V').charAt(0).toUpperCase();
                      const honor = idx === 0 ? 'President' : idx === 1 ? 'Secretary' : 'Operations';
                      return (
                        <div key={m.id || m.name} className="exec-card">
                          <span className="exec-badge-ribbon">{honor}</span>
                          <div className="exec-avatar">
                            {m.photo_url ? (
                              <img
                                src={m.photo_url}
                                alt={m.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span className="avatar-fallback" style={{ display: m.photo_url ? 'none' : 'flex' }}>
                              {initial}
                            </span>
                          </div>
                          <h4 className="exec-name">{m.name}</h4>
                          <div className="exec-role-ml">{m.role_ml || m.role}</div>
                          <div className="exec-role-en">{m.role}</div>

                          <div className="exec-actions">
                            {m.phone && (
                              <a
                                href={`tel:${m.phone}`}
                                className="icon-btn"
                                title={`Call ${m.name}`}
                                aria-label={`Call ${m.name}`}
                              >
                                <Phone size={13} />
                              </a>
                            )}
                            {m.link && (
                              <a
                                href={m.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="icon-btn"
                                title={`Instagram @${m.name}`}
                                aria-label={`Instagram profile of ${m.name}`}
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              {/* SECTION 2: KEY PORTFOLIOS (DEPARTMENTALIZED) */}
              <div className="wing-group-block">
                  <div className="wing-group-header">
                    <div className="wing-group-title-wrap">
                      <div
                        className="wing-group-icon"
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                        }}
                      >
                        <Layers size={18} />
                      </div>
                      <div>
                        <h3 className="wing-group-title">
                          Key Portfolios
                          <span className="wing-group-title-ml">വകുപ്പ് ചുമതലകൾ</span>
                        </h3>
                        <p className="wing-group-desc">
                          Specialized departmental teams managing sports, finance, media, and welfare
                        </p>
                      </div>
                    </div>
                    <span className="wing-badge-count">{portfolioMembers.length} Members</span>
                  </div>

                  {/* Render each department group */}
                  {Object.entries(portfolioGroups).map(([deptName, membersList]) => {
                    if (!membersList || membersList.length === 0) return null;
                    const config = PORTFOLIO_CONFIG[deptName] || {
                      title: deptName,
                      title_ml: deptName,
                      icon: Award,
                      color: '#c5a059',
                      bgColor: 'rgba(197, 160, 89, 0.1)',
                      borderColor: 'rgba(197, 160, 89, 0.3)',
                      description: 'Club portfolio operations',
                    };
                    const DeptIcon = config.icon;

                    return (
                      <div key={deptName} className="dept-cluster">
                        <div className="dept-header">
                          <div className="dept-title-left">
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                background: config.bgColor,
                                color: config.color,
                                border: `1px solid ${config.borderColor}`,
                              }}
                            >
                              <DeptIcon size={14} />
                            </span>
                            <div>
                              <h4 className="dept-title">
                                {config.title}
                                <span className="dept-title-ml"> · {config.title_ml}</span>
                              </h4>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: config.color,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: config.bgColor,
                            }}
                          >
                            {membersList.length} Officers
                          </span>
                        </div>

                        <div className="dept-members-grid">
                          {membersList.map((m) => {
                            const initial = (m.name || 'V').charAt(0).toUpperCase();
                            return (
                              <div key={m.id || m.name} className="compact-member-card">
                                <div className="card-avatar">
                                  {m.photo_url ? (
                                    <img
                                      src={m.photo_url}
                                      alt={m.name}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <span className="avatar-fallback" style={{ display: m.photo_url ? 'none' : 'flex' }}>
                                    {initial}
                                  </span>
                                </div>
                                <div className="card-details">
                                  <h5 className="card-name">{m.name}</h5>
                                  <p className="card-role-line">{m.role_ml || m.role}</p>
                                  <p className="card-subrole">{config.title}</p>
                                </div>
                                <div className="card-actions">
                                  {m.phone && (
                                    <a
                                      href={`tel:${m.phone}`}
                                      className="icon-btn"
                                      title={`Call ${m.name}`}
                                      aria-label={`Call ${m.name}`}
                                    >
                                      <Phone size={13} />
                                    </a>
                                  )}
                                  {m.link && (
                                    <a
                                      href={m.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="icon-btn"
                                      title={`Instagram @${m.name}`}
                                      aria-label={`Instagram profile of ${m.name}`}
                                    >
                                      <ExternalLink size={13} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              {/* SECTION 3: GCC WING (DIASPORA CHAPTER) */}
              <div className="wing-group-block">
                  <div className="wing-group-header">
                    <div className="wing-group-title-wrap">
                      <div
                        className="wing-group-icon"
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                        }}
                      >
                        <Globe2 size={18} />
                      </div>
                      <div>
                        <h3 className="wing-group-title">
                          GCC Wing
                          <span className="wing-group-title-ml">പ്രവാസി ചാപ്റ്റർ</span>
                        </h3>
                        <p className="wing-group-desc">
                          Expatriate committee members in Gulf nations championing village development &amp; club sponsorships
                        </p>
                      </div>
                    </div>
                    <span className="wing-badge-count">{gccMembers.length} Members</span>
                  </div>

                  <div className="roster-grid">
                    {gccMembers.map((m, idx) => (
                      <div key={m.id || m.name} className="roster-item">
                        <div className="roster-avatar">
                          {m.photo_url ? (
                            <img
                              src={m.photo_url}
                              alt={m.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.roster-index');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className="roster-index" style={{ display: m.photo_url ? 'none' : 'flex' }}>
                            #{idx + 1}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h5 className="roster-name">{m.name}</h5>
                          <p className="roster-role-tag">{m.role_ml || 'പ്രവാസി ചാപ്റ്റർ അംഗം'}</p>
                        </div>
                        {m.phone && (
                          <a
                            href={`tel:${m.phone}`}
                            className="icon-btn"
                            title={`Call ${m.name}`}
                            aria-label={`Call ${m.name}`}
                          >
                            <Phone size={12} />
                          </a>
                        )}
                        {m.link && (
                          <a
                            href={m.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="icon-btn"
                            title={`Instagram @${m.name}`}
                            aria-label={`Instagram profile of ${m.name}`}
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              {/* SECTION 4: CENTRAL COMMITTEE (GOVERNING COUNCIL) */}
              <div className="wing-group-block">
                  <div className="wing-group-header">
                    <div className="wing-group-title-wrap">
                      <div
                        className="wing-group-icon"
                        style={{
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#c084fc',
                          border: '1px solid rgba(168, 85, 247, 0.35)',
                        }}
                      >
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <h3 className="wing-group-title">
                          Central Committee
                          <span className="wing-group-title-ml">സെൻട്രൽ കമ്മിറ്റി</span>
                        </h3>
                        <p className="wing-group-desc">
                          General council members actively steering ground events, community affairs, and operations
                        </p>
                      </div>
                    </div>
                    <span className="wing-badge-count">{centralMembers.length} Council</span>
                  </div>

                  <div className="roster-grid">
                    {centralMembers.map((m, idx) => (
                      <div key={m.id || m.name} className="roster-item">
                        <div className="roster-avatar">
                          {m.photo_url ? (
                            <img
                              src={m.photo_url}
                              alt={m.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.roster-index');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className="roster-index" style={{ display: m.photo_url ? 'none' : 'flex' }}>
                            #{idx + 1}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h5 className="roster-name">{m.name}</h5>
                          <p className="roster-role-tag">{m.role_ml || 'സെൻട്രൽ കമ്മിറ്റി അംഗം'}</p>
                        </div>
                        {m.phone && (
                          <a
                            href={`tel:${m.phone}`}
                            className="icon-btn"
                            title={`Call ${m.name}`}
                            aria-label={`Call ${m.name}`}
                          >
                            <Phone size={12} />
                          </a>
                        )}
                        {m.link && (
                          <a
                            href={m.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="icon-btn"
                            title={`Instagram @${m.name}`}
                            aria-label={`Instagram profile of ${m.name}`}
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
        </section>

        {/* Social Connect Box */}
        <section className="victory-connect-box">
          <h2 className="victory-connect-title">Connect With Us</h2>
          <p className="victory-connect-sub">
            Follow our official Instagram page for real-time tournament highlights, community news, and announcements.
          </p>

          <a
            href="https://www.instagram.com/victory_pailippuram"
            target="_blank"
            rel="noopener noreferrer"
            className="victory-insta-link"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                clipRule="evenodd"
              />
            </svg>
            @victory_pailippuram
          </a>
        </section>
      </main>

      <footer className="victory-page-footer">
        <p>&copy; 2026 Victory Arts &amp; Sports Club. All rights reserved.</p>
        <p style={{ marginTop: 4, fontSize: 12 }}>Pailippuram, Palakkad Dt, Kerala</p>
      </footer>
    </div>
  );
}