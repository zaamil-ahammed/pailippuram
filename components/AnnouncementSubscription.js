'use client';
import { useState, useEffect } from 'react';
import { showToast } from '../lib/toast';

const STORAGE_KEY = 'pailippuram_announcement_sub';

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
        setSubscribedData(JSON.parse(saved));
      }
    } catch {}
  }, []);

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
        // Generate or retrieve unique client device token
        let deviceToken = localStorage.getItem('pailippuram_device_token');
        if (!deviceToken) {
          deviceToken = `browser-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          localStorage.setItem('pailippuram_device_token', deviceToken);
        }

        // Post browser subscription to server
        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact_type: 'browser',
            target: deviceToken,
            name: 'Device Subscriber',
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

          // Show real native notification via Service Worker
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

    if (!target.trim()) {
      setErrorMsg(
        contactType === 'email' ? 'Please enter your email address' : 'Please enter your mobile/WhatsApp number'
      );
      return;
    }

    if (selectedTopics.length === 0) {
      setErrorMsg('Please select at least one notification topic');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_type: contactType,
          target: target.trim(),
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
        target: target.trim(),
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
        sub: `${target.trim()} added for urgent updates`,
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

  return (
    <div className={`announcement-sub-widget ${className}`} style={{ marginBottom: 16 }}>
      {/* Main Banner Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1b1915 0%, #29241b 100%)',
          color: '#ffffff',
          border: '1.5px solid var(--accent-border, #d8b368)',
          borderRadius: 20,
          padding: '16px 18px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'rgba(216, 179, 104, 0.15)',
                border: '1px solid rgba(216, 179, 104, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              🔔
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#fef3c7' }}>
                  Urgent Community Alerts
                </h3>
                {subscribedData ? (
                  <span
                    className="pill"
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#6ee7b7',
                      borderColor: '#10b981',
                      fontSize: 11,
                      padding: '2px 8px',
                      fontWeight: 700,
                    }}
                  >
                    ✓ Subscribed Active
                  </span>
                ) : (
                  <span
                    className="pill line"
                    style={{
                      color: '#dfbd69',
                      borderColor: 'rgba(223, 189, 105, 0.4)',
                      fontSize: 11,
                      padding: '2px 8px',
                    }}
                  >
                    Free Opt-in
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#d1d5db', lineHeight: 1.4 }}>
                അടിയന്തര അറിയിപ്പുകൾ (KSEB വൈദ്യുതി മുടക്കം, കുടിവെള്ള വിതരണം, കാലാവസ്ഥാ മുന്നറിയിപ്പുകൾ) ഫോണിൽ അറിയാം.
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
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: '8px 12px',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 12.5,
            }}
          >
            <div style={{ color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📢 Receiving:</span>
              <strong style={{ color: '#fef08a' }}>
                {subscribedData.contact_type === 'browser'
                  ? 'Device Push Alerts'
                  : `${subscribedData.contact_type.toUpperCase()}: ${subscribedData.target}`}
              </strong>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn light small"
                onClick={() => setOpenModal(true)}
                style={{
                  minHeight: 30,
                  padding: '0 10px',
                  fontSize: 12,
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                Change Preferences
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
                  padding: '0 4px',
                }}
              >
                Unsubscribe
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            {browserPermission !== 'granted' && (
              <button
                type="button"
                className="btn dark"
                onClick={handleEnablePush}
                style={{
                  flex: '1 1 180px',
                  minHeight: 40,
                  fontSize: 13.5,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #c5a059 0%, #b38b3f 100%)',
                  color: '#1a1814',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(197, 160, 89, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>🔔</span>
                <span>Enable Push Alerts</span>
              </button>
            )}

            <button
              type="button"
              className="btn light"
              onClick={() => setOpenModal(true)}
              style={{
                flex: '1 1 180px',
                minHeight: 40,
                fontSize: 13.5,
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                borderColor: 'rgba(216, 179, 104, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>💬</span>
              <span>Subscribe via WhatsApp / Phone</span>
            </button>
          </div>
        )}
      </div>

      {/* Subscription Modal Form */}
      {openModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 22,
              maxWidth: 480,
              width: '100%',
              padding: '24px 22px',
              maxHeight: '92vh',
              overflowY: 'auto',
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
                <span className="pill line" style={{ fontSize: 11, marginBottom: 4, display: 'inline-block' }}>
                  Nammude Pailippuram Alerts
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>
                  Opt-in for Urgent Community Updates
                </h3>
                <span className="muted small">അടിയന്തര അറിയിപ്പുകൾ ഫോണിൽ ലഭ്യമാക്കുക</span>
              </div>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setOpenModal(false)}
                style={{ width: 34, height: 34, borderRadius: 10 }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {errorMsg && <p className="error" style={{ margin: 0 }}>{errorMsg}</p>}
            {successMsg && (
              <p
                style={{
                  margin: 0,
                  padding: '10px 14px',
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 13.5,
                }}
              >
                {successMsg}
              </p>
            )}

            <form onSubmit={handleSubmitSubscription} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Delivery Channel selector */}
              <div className="field">
                <label style={{ fontWeight: 700 }}>Choose Alert Channel / അറിയിപ്പ് രീതി *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className={`btn ${contactType === 'whatsapp' ? 'dark' : 'light'}`}
                    onClick={() => setContactType('whatsapp')}
                    style={{ fontSize: 13, padding: '8px 4px', minHeight: 40 }}
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    type="button"
                    className={`btn ${contactType === 'phone' ? 'dark' : 'light'}`}
                    onClick={() => setContactType('phone')}
                    style={{ fontSize: 13, padding: '8px 4px', minHeight: 40 }}
                  >
                    📱 SMS / Call
                  </button>
                  <button
                    type="button"
                    className={`btn ${contactType === 'email' ? 'dark' : 'light'}`}
                    onClick={() => setContactType('email')}
                    style={{ fontSize: 13, padding: '8px 4px', minHeight: 40 }}
                  >
                    ✉️ Email
                  </button>
                </div>
              </div>

              {/* Target input */}
              <div className="field">
                <label htmlFor="sub-target" style={{ fontWeight: 700 }}>
                  {contactType === 'email' ? 'Email Address *' : 'Mobile / WhatsApp Number *'}
                </label>
                <input
                  id="sub-target"
                  type={contactType === 'email' ? 'email' : 'tel'}
                  placeholder={contactType === 'email' ? 'name@gmail.com' : 'e.g. 98470 12345'}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                />
              </div>

              {/* Name & Ward */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field">
                  <label htmlFor="sub-name" style={{ fontWeight: 700 }}>Name (പേര്)</label>
                  <input
                    id="sub-name"
                    type="text"
                    placeholder="Optional"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="sub-area" style={{ fontWeight: 700 }}>Area / Ward (സ്ഥലം)</label>
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
                <label style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
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
                      />
                      <span>{topic.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="btnrow" style={{ marginTop: 6 }}>
                <button type="submit" className="btn dark big" disabled={loading} style={{ flex: 2 }}>
                  {loading ? 'Subscribing...' : 'Save & Subscribe · സബ്‌സ്‌ക്രൈബ് ചെയ്യുക'}
                </button>
                <button
                  type="button"
                  className="btn big"
                  onClick={() => setOpenModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
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
