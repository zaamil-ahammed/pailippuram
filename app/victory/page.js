'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VictoryClubLandingPage() {
  const router = useRouter();

  // Scroll to top immediately when landing on /victory
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="victory-page">
      <style>{`
        .victory-page {
          background-color: #050814;
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
          width: 340px;
          height: 340px;
          background: #7c3aed;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.38;
          pointer-events: none;
          z-index: 0;
        }

        .victory-glow-2 {
          position: absolute;
          top: 100px;
          right: 10%;
          width: 320px;
          height: 320px;
          background: #2563eb;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.32;
          pointer-events: none;
          z-index: 0;
        }

        .victory-glow-3 {
          position: absolute;
          bottom: 100px;
          left: 30%;
          width: 360px;
          height: 360px;
          background: #db2777;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.28;
          pointer-events: none;
          z-index: 0;
        }

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
        }

        .victory-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.18s ease;
        }

        .victory-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: #ffffff;
          transform: translateY(-1px);
        }

        .victory-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 20px 48px;
          max-width: 640px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 10;
          text-align: center;
          opacity: 1;
        }

        .victory-logo-wrap {
          width: 170px;
          height: 170px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: #ffffff;
          padding: 12px;
          border: 3px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 16px 40px rgba(124, 58, 237, 0.35);
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
          font-family: 'Baloo Chettan 2', 'Anek Malayalam', sans-serif;
          font-size: 36px;
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 6px;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .victory-subtitle {
          font-size: 22px;
          font-weight: 600;
          color: #cbd5e1;
          margin: 0 0 16px;
        }

        .victory-estd-badge {
          display: inline-block;
          padding: 4px 14px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          margin-bottom: 20px;
        }

        .victory-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 22px 20px;
          margin-bottom: 24px;
          backdrop-filter: blur(12px);
          text-align: center;
        }

        .victory-lead {
          font-size: 17px;
          color: #f1f5f9;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .victory-text {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .victory-connect-box {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 28px;
          width: 100%;
        }

        .victory-connect-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #ffffff;
        }

        .victory-connect-sub {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .victory-insta-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 26px;
          border-radius: 999px;
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%);
          color: #ffffff !important;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none !important;
          box-shadow: 0 8px 24px rgba(236, 72, 153, 0.35);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .victory-insta-link:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 12px 30px rgba(236, 72, 153, 0.45);
        }

        .victory-page-footer {
          padding: 24px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          color: #64748b;
          font-size: 13px;
          position: relative;
          z-index: 10;
        }

        .victory-page-footer a {
          color: #93c5fd;
          text-decoration: underline;
        }
      `}</style>

      {/* Atmospheric ambient lighting */}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Go Back
        </button>

        <Link href="/" className="victory-btn" title="Back to Directory Home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home Directory
        </Link>
      </header>

      {/* Main Hero & Info */}
      <main className="victory-main">
        <div className="victory-logo-wrap">
          <img
            src="/victory-logo.png"
            alt="Victory Arts & Sports Club"
            className="victory-logo-img"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/400x400/ffffff/000000?text=Victory+Club';
            }}
          />
        </div>

        <h1 className="victory-title">Victory</h1>
        <div className="victory-subtitle">Arts &amp; Sports Club</div>

        <div className="victory-estd-badge">
          ESTD 1994 · PAILIPPURAM
        </div>

        <div className="victory-card">
          <p className="victory-lead">
            Situated in the heart of <strong style={{ color: '#ffffff' }}>Pailippuram, Palakkad district, Kerala</strong>.
          </p>
          <p className="victory-text">
            For over 25 years, Victory has been a cornerstone of cultural and athletic excellence in our community. Since our founding in 1994, we have remained dedicated to nurturing talent, fostering community spirit, and upholding a lasting legacy of excellence in both arts and sports.
          </p>
        </div>

        <section className="victory-connect-box">
          <h2 className="victory-connect-title">Connect With Us</h2>
          <p className="victory-connect-sub">
            Follow us on Instagram to see our latest events, sports matches, and cultural gatherings.
          </p>

          <a
            href="https://www.instagram.com/victory_pailippuram"
            target="_blank"
            rel="noopener noreferrer"
            className="victory-insta-link"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
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