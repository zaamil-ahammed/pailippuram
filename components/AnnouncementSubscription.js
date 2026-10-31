'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { showToast } from '../lib/toast';

const STORAGE_KEY = 'pailippuram_announcement_sub';
const HELPLINE_NUMBER = '919847000000';

export default function AnnouncementSubscription({ className = '' }) {
  const [subscribedData, setSubscribedData] = useState(null);
  const [browserPermission, setBrowserPermission] = useState('default');
  const [openModal, setOpenModal] = useState(false);
  const [contactType, setContactType] = useState('whatsapp');
  const [target, setTarget] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [selectedTopics, setSelectedTopics] = useState(['urgent', 'kseb_water', 'health']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check saved subscription in localStorage and browser permission
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setBrowserPermission(Notification.permission);
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSubscribedData(parsed);
        if (parsed.target) {
          setTarget(parsed.target.replace(/^\+91/, '').trim());
        }
        if (parsed.name) setName(parsed.name);
        if (parsed.area) setArea(parsed.area);
        if (Array.isArray(parsed.topics)) setSelectedTopics(parsed.topics);
        if (parsed.contact_type) setContactType(parsed.contact_type);
      }
    } catch {}
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setOpenModal(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [openModal]);

  const handleToggleTopic = (topicKey) => {
    setSelectedTopics((prev) =>
      prev.includes(topicKey) ? prev.filter((t) => t !== topicKey) : [...prev, topicKey]
    );
  };

  // Direct Browser Push Notification Opt-in
  const handleEnablePush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast({
        type: 'info',
        message: 'Push notifications not supported on this browser',
        sub: 'You can subscribe via WhatsApp or Phone instead.',
      });
      setOpenModal(true);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);

      if (permission === 'granted') {
        let deviceToken = localStorage.getItem('pailippuram_device_token');
        if (!deviceToken) {
          deviceToken = `browser-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          localStorage.setItem('pailippuram_device_token', deviceToken);
        }

        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact_type: 'browser',
            target: deviceToken,
            name: name.trim() || 'Device Subscriber',
            area: area.trim() || undefined,
            topics: selectedTopics.join(','),
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          const subInfo = {
            contact_type: 'browser',
            target: deviceToken,
            topics: selectedTopics,
            date: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(subInfo));
          setSubscribedData(subInfo);

          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              title: '🔔 Alerts Activated!',
              body: 'You are now subscribed to urgent Pailippuram community announcements.',
              url: '/announcements',
            });
          }

          showToast({
            type: 'success',
            message: 'Push Alerts Enabled! 🔔',
            sub: 'Urgent announcements will now appear on your device',
          });
        }
      } else if (permission === 'denied') {
        showToast({
          type: 'error',
          message: 'Notifications blocked in browser settings',
          sub: 'Please enable notifications in site permissions or subscribe via WhatsApp.',
        });
      }
    } catch (err) {
      console.warn('[Push Permission Error]', err);
    }
  };

  // WhatsApp / Phone / Email Subscription Form Submission
  const handleSubmitSubscription = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const rawTarget = target.trim();
    if (!rawTarget) {
      setErrorMsg(
        contactType === 'email'
          ? 'Please enter your email address'
          : 'Please enter your 10-digit WhatsApp/Mobile number'
      );
      return;
    }

    if (contactType !== 'email') {
      const digits = rawTarget.replace(/\D/g, '');
      if (digits.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number');
        return;
      }
    }

    if (selectedTopics.length === 0) {
      setErrorMsg('Please select at least one notification topic');
      return;
    }

    setLoading(true);
    try {
      const formattedTarget =
        contactType === 'email' ? rawTarget : `+91${rawTarget.replace(/\D/g, '').slice(-10)}`;

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_type: contactType,
          target: formattedTarget,
          name: name.trim() || undefined,
          area: area.trim() || undefined,
          topics: selectedTopics.join(','),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Could not complete subscription. Please try again.');
        setLoading(false);
        return;
      }

      const subInfo = {
        contact_type: contactType,
        target: formattedTarget,
        name: name.trim(),
        area: area.trim(),
        topics: selectedTopics,
        date: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(subInfo));
      setSubscribedData(subInfo);
      setSuccessMsg('Subscribed successfully! You will receive urgent community updates.');
      showToast({
        type: 'success',
        message: 'Subscribed to Community Alerts! ✓',
        sub: `${formattedTarget} added for urgent updates`,
      });

      setTimeout(() => {
        setOpenModal(false);
        setSuccessMsg('');
      }, 1200);
    } catch {
      setErrorMsg('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe
  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to opt out of urgent community announcements?')) return;
    setLoading(true);
    try {
      const targetIdentifier = subscribedData?.target;
      if (targetIdentifier) {
        await fetch('/api/subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: targetIdentifier }),
        });
      }
      localStorage.removeItem(STORAGE_KEY);
      setSubscribedData(null);
      setTarget('');
      setName('');
      setArea('');
      showToast({
        type: 'info',
        message: 'Unsubscribed from announcements',
        sub: 'You can opt back in anytime.',
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setSubscribedData(null);
    } finally {
      setLoading(false);
    }
  };

  const directWaLink = `https://wa.me/${HELPLINE_NUMBER}?text=${encodeURIComponent(
    `Hello Pailippuram Community Desk, please subscribe my number for Urgent Community Alerts & Announcements.\n\nName: ${name || 'Resident'}\nWard/Area: ${area || 'Pailippuram'}`
  )}`;

  return (
    <div className={`announcement-sub-widget ${className}`} style={{ marginBottom: 16 }}>
      {/* Main Banner Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #181818 0%, #0d0d0d 100%)',
          color: '#ffffff',
          border: '1.5px solid var(--accent)',
          borderRadius: 22,
          padding: '18px 20px',
          boxShadow: '0 8px 26px rgba(0, 0, 0, 0.28)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(150deg, #dfbd69 0%, #926f34 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                boxShadow: '0 3px 12px rgba(146, 111, 52, 0.4)',
                flexShrink: 0,
              }}
            >
              💬
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#ffffff' }}>
                  Urgent Community Alerts
                </h3>
                {subscribedData ? (
                  <span
                    style={{
                      background: 'var(--accent)',
                      color: '#121212',
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontWeight: 800,
                    }}
                  >
                    ✓ Subscribed Active
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(197, 160, 89, 0.18)',
                      color: '#f0d8a8',
                      border: '1px solid rgba(197, 160, 89, 0.4)',
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  >
                    WhatsApp &amp; Mobile
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#d8d4cc', lineHeight: 1.45 }}>
                അടിയന്തര അറിയിപ്പുകൾ (KSEB വൈദ്യുതി മുടക്കം, കുടിവെള്ളം, കാലാവസ്ഥ) വാട്സാപ്പിൽ അറിയാം.
              </p>
            </div>
          </div>
        </div>

        {/* Action Row */}
        {subscribedData ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(197, 160, 89, 0.25)',
              borderRadius: 14,
              padding: '10px 14px',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 13,
            }}
          >
            <div style={{ color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📢 Receiving via:</span>
              <strong style={{ color: '#dfbd69' }}>
                {subscribedData.contact_type === 'browser'
                  ? 'Device Push Alerts'
                  : `${subscribedData.contact_type.toUpperCase()}: ${subscribedData.target}`}
              </strong>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Link
                href="/subscribe"
                style={{
                  minHeight: 32,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.14)',
                  color: '#ffffff',
                  borderRadius: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                Full Page →
              </Link>
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                style={{
                  minHeight: 32,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(197, 160, 89, 0.2)',
                  color: '#dfbd69',
                  border: '1px solid rgba(197, 160, 89, 0.5)',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
              >
                Edit Topics
              </button>
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '4px',
                }}
              >
                Opt Out
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
            <button
              type="button"
              onClick={() => setOpenModal(true)}
              style={{
                flex: '1 1 200px',
                minHeight: 44,
                fontSize: 14,
                fontWeight: 800,
                background: 'linear-gradient(150deg, #dfbd69 0%, #926f34 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 14,
                boxShadow: '0 3px 12px rgba(146, 111, 52, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <span>💬</span>
              <span>Subscribe via WhatsApp</span>
            </button>

            <Link
              href="/subscribe"
              style={{
                flex: '1 1 140px',
                minHeight: 44,
                fontSize: 13.5,
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(197, 160, 89, 0.35)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                textDecoration: 'none',
              }}
            >
              <span>ℹ️</span>
              <span>Alert Details / വിവരങ്ങൾ</span>
            </Link>
          </div>
        )}
      </div>

      {/* Subscription Modal Form */}
      {openModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '24px 16px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 24,
              maxWidth: 500,
              width: '100%',
              margin: 'auto 0',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
              border: '1.5px solid var(--accent-border, #d8b368)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--card-border)',
                paddingBottom: 12,
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    background: 'var(--accent-tint)',
                    color: 'var(--gold-dark)',
                    border: '1px solid var(--accent-border)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  💬 Nammude Pailippuram Alerts
                </span>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink)', margin: '2px 0 0' }}>
                  Urgent Community Alerts
                </h3>
                <span className="muted small" style={{ fontSize: 12.5, display: 'block', marginTop: 2 }}>
                  വാട്സാപ്പിൽ അടിയന്തര അറിയിപ്പുകൾ സൗജന്യമായി നേടാം
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  minHeight: 36,
                  borderRadius: 12,
                  border: '1px solid var(--card-border)',
                  background: '#f3f4f6',
                  color: '#4b5563',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-tap WhatsApp chat button */}
            <div
              style={{
                background: 'var(--accent-tint)',
                border: '1.5px solid var(--accent-border)',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                <strong style={{ fontSize: 13, color: 'var(--gold-dark)', display: 'block' }}>
                  ⚡ Quick 1-Tap WhatsApp Opt-in
                </strong>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  Send a pre-filled WhatsApp message to the desk
                </span>
              </div>
              <a
                href={directWaLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(150deg, #dfbd69 0%, #926f34 100%)',
                  color: '#ffffff',
                  padding: '7px 14px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 800,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(146, 111, 52, 0.3)',
                }}
              >
                Open WhatsApp →
              </a>
            </div>

            {errorMsg && <p className="error" style={{ margin: 0, fontSize: 13 }}>{errorMsg}</p>}
            {successMsg && (
              <p
                style={{
                  margin: 0,
                  padding: '10px 14px',
                  background: 'var(--accent-tint)',
                  color: 'var(--gold-dark)',
                  border: '1.5px solid var(--accent-border)',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 13.5,
                }}
              >
                {successMsg}
              </p>
            )}

            <form onSubmit={handleSubmitSubscription} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Delivery Channel selector */}
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 13.5 }}>Choose Alert Channel / അറിയിപ്പ് രീതി *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setContactType('whatsapp')}
                    style={{
                      background: contactType === 'whatsapp' ? 'var(--primary)' : '#f9fafb',
                      color: contactType === 'whatsapp' ? '#ffffff' : '#374151',
                      border: contactType === 'whatsapp' ? '1.5px solid var(--primary)' : '1px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '8px 4px',
                      minHeight: 40,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactType('phone')}
                    style={{
                      background: contactType === 'phone' ? 'var(--primary)' : '#f9fafb',
                      color: contactType === 'phone' ? '#ffffff' : '#374151',
                      border: contactType === 'phone' ? '1.5px solid var(--primary)' : '1px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '8px 4px',
                      minHeight: 40,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    📱 SMS / Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactType('email')}
                    style={{
                      background: contactType === 'email' ? 'var(--primary)' : '#f9fafb',
                      color: contactType === 'email' ? '#ffffff' : '#374151',
                      border: contactType === 'email' ? '1.5px solid var(--primary)' : '1px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '8px 4px',
                      minHeight: 40,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✉️ Email
                  </button>
                </div>
              </div>

              {/* Target input */}
              <div className="field">
                <label htmlFor="sub-target" style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {contactType === 'email' ? 'Email Address *' : 'WhatsApp / Mobile Number *'}
                </label>
                {contactType === 'email' ? (
                  <input
                    id="sub-target"
                    type="email"
                    placeholder="name@gmail.com"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    required
                  />
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div
                      style={{
                        background: '#f3f4f6',
                        border: '1.5px solid var(--card-border)',
                        borderRadius: 14,
                        padding: '0 12px',
                        height: 52,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--ink)',
                        flexShrink: 0,
                      }}
                    >
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      id="sub-target"
                      type="tel"
                      inputMode="numeric"
                      placeholder="e.g. 98470 12345"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      style={{ flex: 1 }}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Name & Ward */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="field">
                  <label htmlFor="sub-name" style={{ fontWeight: 700, fontSize: 13.5 }}>
                    Name (പേര്) <span className="muted small">(optional)</span>
                  </label>
                  <input
                    id="sub-name"
                    type="text"
                    placeholder="e.g. Suresh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="sub-area" style={{ fontWeight: 700, fontSize: 13.5 }}>
                    Area / Ward (സ്ഥലം, വാർഡ്) <span className="muted small">(optional)</span>
                  </label>
                  <input
                    id="sub-area"
                    type="text"
                    placeholder="e.g. Ward 4 / Town"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
              </div>

              {/* Topic Preferences */}
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4, display: 'block' }}>
                  Select Topics / ഏതെല്ലാം അറിയിപ്പുകൾ വേണം?
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { key: 'urgent', label: '🚨 Urgent Alerts & Weather (അടിയന്തര അറിയിപ്പുകൾ)' },
                    { key: 'kseb_water', label: '⚡ KSEB Power Cuts & Water Supply (വൈദ്യുതി & കുടിവെള്ളം)' },
                    { key: 'health', label: '🏥 Blood Donation Calls & Health Camps (രക്തദാനം & ആരോഗ്യം)' },
                    { key: 'general', label: '📢 Village Events & Grama Panchayat Notices (പൊതു പരിപാടികൾ)' },
                  ].map((topic) => (
                    <label
                      key={topic.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        cursor: 'pointer',
                        background: selectedTopics.includes(topic.key) ? 'var(--accent-tint, #faf6ee)' : '#f9fafb',
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: selectedTopics.includes(topic.key)
                          ? '1px solid var(--accent-border, #d8b368)'
                          : '1px solid #e5e7eb',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic.key)}
                        onChange={() => handleToggleTopic(topic.key)}
                        style={{ width: 17, height: 17, flexShrink: 0, accentColor: 'var(--primary)' }}
                      />
                      <span>{topic.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: '1.5px solid var(--primary)',
                    borderRadius: 14,
                    minHeight: 48,
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {loading ? 'Subscribing...' : 'Save & Subscribe · സബ്‌സ്‌ക്രൈബ് ചെയ്യുക'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <Link
                    href="/subscribe"
                    onClick={() => setOpenModal(false)}
                    style={{ fontSize: 13, color: 'var(--gold-dark)', fontWeight: 700 }}
                  >
                    Open Full Page View →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <p className="muted small" style={{ margin: 0, textAlign: 'center', fontSize: 11.5 }}>
                🔒 100% free community service. We never spam or share your contact details. Opt-out anytime.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
