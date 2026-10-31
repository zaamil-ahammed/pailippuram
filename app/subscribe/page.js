'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import { showToast } from '../../lib/toast';

const STORAGE_KEY = 'pailippuram_announcement_sub';
const COMMUNITY_WA_LINK = 'https://chat.whatsapp.com/';
const HELPLINE_NUMBER = '919847000000'; // Community coordinator WhatsApp

export default function SubscribePage() {
  const [subscribedData, setSubscribedData] = useState(null);
  const [browserPermission, setBrowserPermission] = useState('default');
  const [contactType, setContactType] = useState('whatsapp');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [selectedTopics, setSelectedTopics] = useState(['urgent', 'kseb_water', 'health', 'general']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editMode, setEditMode] = useState(false);

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
          if (parsed.contact_type === 'email') {
            setEmail(parsed.target);
          } else {
            setPhone(parsed.target.replace(/^\+91/, '').trim());
          }
        }
        if (parsed.name) setName(parsed.name);
        if (parsed.area) setArea(parsed.area);
        if (Array.isArray(parsed.topics)) setSelectedTopics(parsed.topics);
      }
    } catch {}
  }, []);

  const handleToggleTopic = (topicKey) => {
    setSelectedTopics((prev) =>
      prev.includes(topicKey) ? prev.filter((t) => t !== topicKey) : [...prev, topicKey]
    );
  };

  const handleEnablePush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast({
        type: 'info',
        message: 'Push alerts not supported in this browser',
        sub: 'Please enter your WhatsApp or Phone number below instead.',
      });
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
            name: name.trim(),
            area: area.trim(),
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
            sub: 'Urgent announcements will appear on this device.',
          });
        }
      } else if (permission === 'denied') {
        showToast({
          type: 'error',
          message: 'Notifications blocked in browser',
          sub: 'Please allow notifications in browser permissions or subscribe via WhatsApp.',
        });
      }
    } catch (err) {
      console.warn('[Push Error]', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetVal = contactType === 'email' ? email.trim() : phone.trim();
    if (!targetVal) {
      setErrorMsg(
        contactType === 'email'
          ? 'Please enter your email address'
          : 'Please enter your 10-digit WhatsApp/Mobile number'
      );
      return;
    }

    if (contactType !== 'email') {
      const digits = targetVal.replace(/\D/g, '');
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
      const finalTarget = contactType === 'email' ? targetVal : `+91${targetVal.replace(/\D/g, '').slice(-10)}`;
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_type: contactType,
          target: finalTarget,
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
        target: finalTarget,
        name: name.trim(),
        area: area.trim(),
        topics: selectedTopics,
        date: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(subInfo));
      setSubscribedData(subInfo);
      setEditMode(false);
      setSuccessMsg('Subscribed successfully! You will receive urgent community updates.');
      showToast({
        type: 'success',
        message: 'Subscribed to Community Alerts! ✓',
        sub: `${finalTarget} added for urgent updates`,
      });
    } catch {
      setErrorMsg('Network error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

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
      setPhone('');
      setEmail('');
      setName('');
      setArea('');
      setEditMode(false);
      showToast({
        type: 'info',
        message: 'Unsubscribed from announcements',
        sub: 'You can opt back in anytime.',
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setSubscribedData(null);
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessageLink = `https://wa.me/${HELPLINE_NUMBER}?text=${encodeURIComponent(
    `Hello Pailippuram Community Desk, please subscribe my number for Urgent Community Alerts & Announcements.\n\nName: ${name || 'Resident'}\nWard/Area: ${area || 'Pailippuram'}`
  )}`;

  return (
    <div className="page">
      <PageHeader
        title="Community Alerts"
        ml="അടിയന്തര വാട്സാപ്പ് അറിയിപ്പുകൾ"
        back="/announcements"
        backLabel="Announcements"
      />

      <main className="body" style={{ gap: 20 }}>
        {/* Top Hero Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #181818 0%, #0d0d0d 100%)',
            color: '#ffffff',
            border: '1.5px solid var(--accent)',
            borderRadius: 24,
            padding: '22px 20px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: 'linear-gradient(150deg, #dfbd69 0%, #926f34 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  boxShadow: '0 4px 14px rgba(146, 111, 52, 0.4)',
                  flexShrink: 0,
                }}
              >
                💬
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    background: 'var(--accent-tint)',
                    color: 'var(--gold-dark)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 999,
                    padding: '2px 10px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    marginBottom: 4,
                  }}
                >
                  Official WhatsApp &amp; Mobile Service
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Urgent Community Alerts
                </h2>
              </div>
            </div>
            {subscribedData && (
              <span
                style={{
                  background: 'var(--accent)',
                  color: '#121212',
                  fontSize: 11.5,
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                ✓ Active
              </span>
            )}
          </div>

          <p style={{ margin: 0, fontSize: 14, color: '#d8d4cc', lineHeight: 1.5 }}>
            പൈലിപ്പുറത്തെ അടിയന്തര അറിയിപ്പുകൾ (KSEB വൈദ്യുതി മുടക്കം, കുടിവെള്ള വിതരണം, അടിയന്തര രക്തദാനം, കാലാവസ്ഥാ മുന്നറിയിപ്പുകൾ) നിങ്ങളുടെ വാട്സാപ്പിൽ വേഗത്തിൽ അറിയാം.
          </p>

          {/* Quick Instant Join & Message Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 4 }}>
            <a
              href={whatsappMessageLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(150deg, #dfbd69 0%, #926f34 100%)',
                color: '#ffffff',
                borderRadius: 14,
                padding: '12px 16px',
                fontWeight: 800,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(146, 111, 52, 0.35)',
                textDecoration: 'none',
              }}
            >
              <span>💬</span>
              <span>1-Tap WhatsApp Opt-in</span>
            </a>

            <button
              type="button"
              onClick={handleEnablePush}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1.5px solid rgba(197, 160, 89, 0.35)',
                borderRadius: 14,
                padding: '12px 16px',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <span>🔔</span>
              <span>Enable Browser Push Alerts</span>
            </button>
          </div>
        </div>

        {/* Active Subscription Status Banner if already registered */}
        {subscribedData && !editMode && (
          <div
            className="card"
            style={{
              border: '1.5px solid var(--accent-border)',
              background: 'var(--accent-tint)',
              borderRadius: 20,
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--accent)',
                    color: '#121212',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  ✓ Subscribed &amp; Verified
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--gold-dark)', margin: '4px 0' }}>
                  Receiving Alerts via {subscribedData.contact_type.toUpperCase()}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--ink)', margin: 0, fontWeight: 700 }}>
                  {subscribedData.target}
                  {subscribedData.name ? ` · ${subscribedData.name}` : ''}
                  {subscribedData.area ? ` (${subscribedData.area})` : ''}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                  Subscribed on {new Date(subscribedData.date || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn dark"
                onClick={() => setEditMode(true)}
                style={{
                  minHeight: 40,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '0 16px',
                  borderRadius: 12,
                }}
              >
                ✏️ Edit Topics &amp; Phone Number
              </button>
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: '1.5px solid #fca5a5',
                  color: '#dc2626',
                  borderRadius: 12,
                  minHeight: 40,
                  padding: '0 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Opt Out / Unsubscribe
              </button>
            </div>
          </div>
        )}

        {/* Subscription Form (shows when new or editing) */}
        {(!subscribedData || editMode) && (
          <div
            className="card"
            style={{
              borderRadius: 22,
              padding: '22px 20px',
              border: '1.5px solid var(--accent-border, #e8ddc8)',
              background: '#ffffff',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
                {editMode ? 'Update Alert Preferences' : 'Register for WhatsApp & Mobile Alerts'}
              </h3>
              <p className="muted small" style={{ marginTop: 2 }}>
                വാട്സാപ്പ് അല്ലെങ്കിൽ മൊബൈൽ നമ്പർ നൽകി അറിയിപ്പുകൾ നേരിട്ട് സ്വീകരിക്കുക
              </p>
            </div>

            {errorMsg && <p className="error" style={{ marginBottom: 14 }}>{errorMsg}</p>}
            {successMsg && (
              <p
                style={{
                  marginBottom: 14,
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Channel Selector */}
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 14 }}>
                  Select Alert Delivery Method / അറിയിപ്പ് ലഭിക്കേണ്ട മാർഗ്ഗം *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setContactType('whatsapp')}
                    style={{
                      background: contactType === 'whatsapp' ? 'var(--primary)' : '#f9fafb',
                      color: contactType === 'whatsapp' ? '#ffffff' : '#374151',
                      border: contactType === 'whatsapp' ? '1.5px solid var(--primary)' : '1.5px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '10px 6px',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContactType('phone')}
                    style={{
                      background: contactType === 'phone' ? 'var(--primary)' : '#f9fafb',
                      color: contactType === 'phone' ? '#ffffff' : '#374151',
                      border: contactType === 'phone' ? '1.5px solid var(--primary)' : '1.5px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '10px 6px',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span>📱</span>
                    <span>SMS / Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContactType('email')}
                    style={{
                      background: contactType === 'email' ? 'var(--primary)' : '#f9fafb',
                      color: contactType === 'email' ? '#ffffff' : '#374151',
                      border: contactType === 'email' ? '1.5px solid var(--primary)' : '1.5px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '10px 6px',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span>✉️</span>
                    <span>Email</span>
                  </button>
                </div>
              </div>

              {/* Target Input */}
              {contactType === 'email' ? (
                <div className="field">
                  <label htmlFor="sub-email" style={{ fontWeight: 700, fontSize: 14 }}>
                    Email Address / ഇമെയിൽ വിലാസം *
                  </label>
                  <input
                    id="sub-email"
                    type="email"
                    placeholder="e.g. resident@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="sub-phone" style={{ fontWeight: 700, fontSize: 14 }}>
                    {contactType === 'whatsapp' ? 'WhatsApp Number / വാട്സാപ്പ് നമ്പർ *' : 'Mobile Number / ഫോൺ നമ്പർ *'}
                  </label>
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
                      id="sub-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="e.g. 98470 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ flex: 1 }}
                      required
                    />
                  </div>
                  <span className="muted small" style={{ fontSize: 11.5, marginTop: 2 }}>
                    {contactType === 'whatsapp'
                      ? 'വാട്സാപ്പിൽ സന്ദേശങ്ങൾ ലഭിക്കാൻ active ആയ നമ്പർ നൽകുക.'
                      : 'അടിയന്തര അറിയിപ്പുകൾ SMS / വോയിസ് ആയി ലഭിക്കും.'}
                  </span>
                </div>
              )}

              {/* Name & Ward */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="field">
                  <label htmlFor="sub-name" style={{ fontWeight: 700, fontSize: 14 }}>
                    Your Name / പേര് <span className="muted small">(optional)</span>
                  </label>
                  <input
                    id="sub-name"
                    type="text"
                    placeholder="e.g. Suresh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="sub-area" style={{ fontWeight: 700, fontSize: 14 }}>
                    Ward or Area in Pailippuram / സ്ഥലം, വാർഡ് <span className="muted small">(optional)</span>
                  </label>
                  <input
                    id="sub-area"
                    type="text"
                    placeholder="e.g. Ward 4 / Town / Pallippuram"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
              </div>

              {/* Topics Selection */}
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: 'block' }}>
                  Select Topics / ഏതെല്ലാം അറിയിപ്പുകൾ വേണം?
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    {
                      key: 'urgent',
                      icon: '🚨',
                      title: 'Urgent Alerts & Weather Warnings',
                      ml: 'അടിയന്തര മുന്നറിയിപ്പുകൾ & കാലാവസ്ഥ',
                    },
                    {
                      key: 'kseb_water',
                      icon: '⚡',
                      title: 'KSEB Power Cuts & Water Supply Disruption',
                      ml: 'വൈദ്യുതി മുടക്കം & കുടിവെള്ള വിതരണം',
                    },
                    {
                      key: 'health',
                      icon: '🏥',
                      title: 'Emergency Blood Calls & Health Camps',
                      ml: 'രക്തദാന ആഹ്വാനങ്ങൾ & മെഡിക്കൽ ക്യാമ്പുകൾ',
                    },
                    {
                      key: 'general',
                      icon: '📢',
                      title: 'Village Events & Grama Panchayat Notices',
                      ml: 'പഞ്ചായത്ത് അറിയിപ്പുകൾ & പൊതു പരിപാടികൾ',
                    },
                  ].map((topic) => {
                    const active = selectedTopics.includes(topic.key);
                    return (
                      <label
                        key={topic.key}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 12,
                          background: active ? 'var(--accent-tint, #faf6ee)' : '#f9fafb',
                          border: active ? '1.5px solid var(--accent-border, #d8b368)' : '1px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => handleToggleTopic(topic.key)}
                          style={{
                            width: 18,
                            height: 18,
                            flexShrink: 0,
                            marginTop: 3,
                            accentColor: 'var(--primary)',
                            cursor: 'pointer',
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                            {topic.icon} {topic.title}
                          </span>
                          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                            {topic.ml}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: '1.5px solid var(--primary)',
                    borderRadius: 14,
                    minHeight: 50,
                    fontWeight: 800,
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {loading ? (
                    'Saving preferences...'
                  ) : (
                    <>
                      <span>{contactType === 'whatsapp' ? '💬' : '✓'}</span>
                      <span>
                        {editMode ? 'Update Subscription' : 'Subscribe via WhatsApp & Mobile · സബ്‌സ്‌ക്രൈബ് ചെയ്യുക'}
                      </span>
                    </>
                  )}
                </button>

                {editMode && (
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="btn light"
                    style={{ minHeight: 44, borderRadius: 14 }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#64748b',
                }}
              >
                <span>🔒</span>
                <span>
                  100% Free village initiative. Your contact details are stored securely and never shared with third parties. You can opt out anytime.
                </span>
              </div>
            </form>
          </div>
        )}

        {/* Informative Cards: What Updates You Get */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>
            What alerts will you receive? / ഏതൊക്കെ അറിയിപ്പുകൾ?
          </h3>

          <div
            className="card"
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: '#ffffff',
              border: '1px solid var(--card-border)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>KSEB Power Cuts</h4>
                  <p className="muted small">വൈദ്യുതി ലൈൻ അറ്റകുറ്റപ്പണി, ലൈൻ ഷട്ട്ഡൗൺ സമയം മുൻകൂട്ടി അറിയാം.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>💧</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Drinking Water Supply</h4>
                  <p className="muted small">കുടിവെള്ള വിതരണം മുടങ്ങുന്നതും പൈപ്പ് പൊട്ടൽ വിവരങ്ങളും അറിയാം.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>🩸</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Emergency Blood Donor Calls</h4>
                  <p className="muted small">അടിയന്തര ഘട്ടങ്ങളിൽ രക്തം ആവശ്യമുള്ള അറിയിപ്പുകൾ ഉടൻ ലഭ്യമാക്കുന്നു.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>⛈️</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Heavy Rain &amp; Disaster Alerts</h4>
                  <p className="muted small">കനത്ത മഴ, ഓറഞ്ച്/റെഡ് അലർട്ട് മുന്നറിയിപ്പുകൾ നേരിട്ട് ഫോണിൽ.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link to Announcements */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <Link
            href="/announcements"
            className="btn light"
            style={{
              padding: '0 20px',
              minHeight: 44,
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            ← View All Announcements · അറിയിപ്പുകൾ കാണുക
          </Link>
        </div>
      </main>
    </div>
  );
}
