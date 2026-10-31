'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import { useAdmin } from '../../../components/AdminGate';
import { formatDate } from '../../../lib/supabase';
import { showToast } from '../../../lib/toast';

export default function AdminNotificationsPage() {
  const { user } = useAdmin();
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'history' | 'subscribers'
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    browserCount: 0,
    whatsappCount: 0,
    phoneCount: 0,
    emailCount: 0,
  });
  const [subscribers, setSubscribers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State for Composing Custom Notification
  const [title, setTitle] = useState('');
  const [titleMl, setTitleMl] = useState('');
  const [body, setBody] = useState('');
  const [urgency, setUrgency] = useState('urgent');
  const [topic, setTopic] = useState('all');
  const [publishAnnouncement, setPublishAnnouncement] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastBroadcast, setLastBroadcast] = useState(null);

  // Subscriber list filter & search
  const [subFilter, setSubFilter] = useState('all');
  const [subSearch, setSubSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/notifications?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats || {});
        setSubscribers(data.subscribers || []);
        setNotifications(data.notifications || []);
      } else {
        setErrorMsg(data.error || 'Failed to load notifications data');
      }
    } catch {
      setErrorMsg('Could not connect to notifications API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Broadcast Submission
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast({ type: 'error', message: 'Please enter a notification title' });
      return;
    }
    if (!body.trim()) {
      showToast({ type: 'error', message: 'Please enter notification details' });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          title_ml: titleMl.trim() || undefined,
          body: body.trim(),
          urgency,
          topic,
          publishAnnouncement,
          sender: user?.email || 'Admin',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast({
          type: 'error',
          message: 'Broadcast failed',
          sub: data.error || 'Error sending custom notification',
        });
        setSending(false);
        return;
      }

      // Trigger local browser notification for administrator testing if active
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: `📢 ${title.trim()}`,
          body: body.trim().slice(0, 140),
          url: '/announcements',
        });
      }

      setLastBroadcast(data);
      showToast({
        type: 'success',
        message: 'Notification Broadcasted! 🚀',
        sub: `Dispatched to ${data.subscribersReached || 0} subscriber(s)`,
      });

      // Clear form
      setTitle('');
      setTitleMl('');
      setBody('');

      await loadData();
    } catch (err) {
      showToast({ type: 'error', message: err?.message || 'Error dispatching notification' });
    } finally {
      setSending(false);
    }
  };

  // Delete notification from history
  const handleDeleteNotif = async (id) => {
    if (!confirm('Remove this broadcast from the notification history?')) return;
    try {
      const res = await fetch(`/api/admin/notifications?notifId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ type: 'info', message: 'Notification removed from log' });
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch {}
  };

  // Delete subscriber
  const handleDeleteSub = async (id, targetName) => {
    if (!confirm(`Unsubscribe and remove ${targetName}?`)) return;
    try {
      const res = await fetch(`/api/admin/notifications?subId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ type: 'info', message: 'Subscriber removed' });
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        loadData();
      }
    } catch {}
  };

  // Filtered subscribers list
  const filteredSubscribers = subscribers.filter((s) => {
    if (subFilter !== 'all' && s.contact_type !== subFilter) return false;
    if (subSearch.trim()) {
      const q = subSearch.toLowerCase();
      const matchTarget = (s.target || '').toLowerCase().includes(q);
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchArea = (s.area || '').toLowerCase().includes(q);
      return matchTarget || matchName || matchArea;
    }
    return true;
  });

  return (
    <div className="page">
      <PageHeader
        title="Custom Notifications"
        ml="അറിയിപ്പുകൾ അയക്കുക & വരിക്കാർ"
        back="/admin"
        backLabel="Back to Admin"
        action={
          <Link href="/announcements" target="_blank" className="btn light small" style={{ minHeight: 34, fontSize: 13 }}>
            View Public Page &rarr;
          </Link>
        }
      />

      <main className="body" style={{ gap: 16 }}>
        {errorMsg && <p className="error">{errorMsg}</p>}

        {/* Metric Cards Row */}
        <div className="grid2" style={{ gap: 10 }}>
          <div
            className="card"
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: '#ffffff',
              border: '1.5px solid var(--card-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted small" style={{ fontWeight: 600 }}>Active Subscribers</span>
              <span className="pill small" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                Opted In
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold-dark)', marginTop: 4 }}>
              {stats.activeSubscribers}
            </div>
            <div className="small muted" style={{ marginTop: 2 }}>
              {stats.whatsappCount} WhatsApp · {stats.browserCount} Browser · {stats.phoneCount} SMS · {stats.emailCount} Email
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: '#ffffff',
              border: '1.5px solid var(--card-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted small" style={{ fontWeight: 600 }}>Broadcast Reach</span>
              <span className="pill small">1-Click Multi-Channel</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--ink)', marginTop: 4 }}>
              {notifications.length}
            </div>
            <div className="small muted" style={{ marginTop: 2 }}>
              Past custom announcements &amp; community alerts dispatched
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="chips" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: 6 }}>
          <button
            type="button"
            className={`chip ${activeTab === 'compose' ? 'on' : ''}`}
            onClick={() => setActiveTab('compose')}
            style={{ fontWeight: 700 }}
          >
            📢 Send Notification · അറിയിപ്പ് അയക്കുക
          </button>
          <button
            type="button"
            className={`chip ${activeTab === 'history' ? 'on' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{ fontWeight: 700 }}
          >
            📜 Past Broadcasts ({notifications.length})
          </button>
          <button
            type="button"
            className={`chip ${activeTab === 'subscribers' ? 'on' : ''}`}
            onClick={() => setActiveTab('subscribers')}
            style={{ fontWeight: 700 }}
          >
            👥 Subscribers ({subscribers.length})
          </button>
        </div>

        {/* TAB 1: COMPOSE & BROADCAST NOTIFICATION */}
        {activeTab === 'compose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success Broadcast Modal / Callout if just sent */}
            {lastBroadcast && (
              <div
                className="card"
                style={{
                  background: '#f0fdf4',
                  borderColor: '#86efac',
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>🎉</span>
                    <div>
                      <strong style={{ color: '#166534', fontSize: 15 }}>
                        Broadcast Successfully Dispatched!
                      </strong>
                      <p style={{ margin: 0, fontSize: 13, color: '#15803d' }}>
                        Reached {lastBroadcast.subscribersReached || 0} subscriber(s). Published to live announcements.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastBroadcast(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: 16 }}
                  >
                    ✕
                  </button>
                </div>

                {lastBroadcast.whatsappShareUrl && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                    <a
                      href={lastBroadcast.whatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn dark"
                      style={{
                        background: 'linear-gradient(150deg, #dfbd69 0%, #926f34 100%)',
                        borderColor: 'var(--accent)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: 13.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>💬</span>
                      <span>Share to WhatsApp Groups &amp; Status</span>
                    </a>
                    <button
                      type="button"
                      className="btn light"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(lastBroadcast.whatsappFormattedText || '');
                          showToast({ type: 'success', message: 'Message text copied to clipboard!' });
                        }
                      }}
                      style={{ fontSize: 13 }}
                    >
                      📋 Copy Formatted Text
                    </button>
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={handleBroadcast}
              className="card"
              style={{
                borderRadius: 20,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                background: '#ffffff',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--ink)' }}>
                  Compose Community Announcement / Alert
                </h3>
                <p className="muted small" style={{ margin: '3px 0 0' }}>
                  Dispatches push notifications, syncs with live announcements, and generates formatted WhatsApp broadcasts.
                </p>
              </div>

              {/* Urgency selector */}
              <div className="field">
                <label style={{ fontWeight: 700 }}>Alert Urgency / സ്വഭാവം *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 4 }}>
                  {[
                    { key: 'urgent', emoji: '🚨', label: 'Urgent Alert', desc: 'അടിയന്തരം' },
                    { key: 'service', emoji: '⚡', label: 'Power / Water', desc: 'വൈദ്യുതി/വെള്ളം' },
                    { key: 'general', emoji: '📢', label: 'General News', desc: 'പൊതു അറിയിപ്പ്' },
                    { key: 'health', emoji: '🏥', label: 'Health / Blood', desc: 'ആരോഗ്യം/രക്തം' },
                  ].map((u) => (
                    <button
                      key={u.key}
                      type="button"
                      onClick={() => setUrgency(u.key)}
                      className={`btn ${urgency === u.key ? 'dark' : 'light'}`}
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        minHeight: 52,
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{u.emoji} {u.label}</span>
                      <span style={{ fontSize: 11, opacity: 0.8 }}>{u.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Titles in English and Malayalam */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div className="field">
                  <label htmlFor="notif-title" style={{ fontWeight: 700 }}>
                    Headline / Title (English) *
                  </label>
                  <input
                    id="notif-title"
                    type="text"
                    placeholder="e.g. KSEB Power Shutdown Tomorrow (9 AM - 5 PM)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="notif-title-ml" style={{ fontWeight: 700 }}>
                    Malayalam Title (മലയാളം തലക്കെട്ട്)
                  </label>
                  <input
                    id="notif-title-ml"
                    type="text"
                    placeholder="e.g. നാളെ പൈലിപ്പുറത്ത് വൈദ്യുതി മുടങ്ങും"
                    value={titleMl}
                    onChange={(e) => setTitleMl(e.target.value)}
                  />
                </div>
              </div>

              {/* Message Body */}
              <div className="field">
                <label htmlFor="notif-body" style={{ fontWeight: 700 }}>
                  Detailed Message / വിശദവിവരങ്ങൾ *
                </label>
                <textarea
                  id="notif-body"
                  rows={4}
                  placeholder="Details of the announcement, affected areas/wards, contact numbers, timings..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>

              {/* Target Topic Audience */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="field">
                  <label htmlFor="notif-topic" style={{ fontWeight: 700 }}>
                    Audience Filter / ഉപഭോക്താക്കൾ
                  </label>
                  <select id="notif-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                    <option value="all">All Subscribers (എല്ലാവർക്കും)</option>
                    <option value="urgent">Urgent Alert Subscribers Only</option>
                    <option value="kseb_water">KSEB &amp; Water Supply Subscribers</option>
                    <option value="health">Health &amp; Blood Need Subscribers</option>
                    <option value="general">General Village Events Subscribers</option>
                  </select>
                </div>

                <div className="field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="check" style={{ marginTop: 24, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={publishAnnouncement}
                      onChange={(e) => setPublishAnnouncement(e.target.checked)}
                    />
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                      📌 Also publish as pinned announcement on website
                    </span>
                  </label>
                </div>
              </div>

              {/* Live Preview of the notification */}
              {(title || body) && (
                <div
                  style={{
                    background: 'var(--card-subtle, #faf8f5)',
                    border: '1.5px dashed var(--accent-border, #d8b368)',
                    borderRadius: 14,
                    padding: 14,
                    marginTop: 4,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-dark)', marginBottom: 6, textTransform: 'uppercase' }}>
                    📱 Live Preview (What residents will see)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>
                      {{ urgent: '🚨', service: '⚡', general: '📢', health: '🏥' }[urgency] || '📢'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
                        {title || 'Notification Headline'}
                      </div>
                      {titleMl && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 1 }}>{titleMl}</div>}
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151', whiteSpace: 'pre-line' }}>
                        {body || 'Announcement details will appear here...'}
                      </p>
                      <div className="small muted" style={{ marginTop: 6 }}>
                        📍 Nammude Pailippuram Alerts · Just now
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="btnrow" style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn dark big"
                  disabled={sending}
                  style={{ flex: 2, fontWeight: 800, gap: 8 }}
                >
                  <span>🚀</span>
                  <span>{sending ? 'Broadcasting...' : 'Broadcast Notification Now · അയക്കുക'}</span>
                </button>
                <button
                  type="button"
                  className="btn big"
                  onClick={() => {
                    setTitle('');
                    setTitleMl('');
                    setBody('');
                  }}
                  style={{ flex: 1 }}
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: PAST BROADCASTS / HISTORY */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                <span style={{ fontSize: 32 }}>📜</span>
                <p style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>No broadcast history yet</p>
                <p className="muted small">Send a custom notification from the compose tab to see it logged here.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const urgencyBadge = {
                  urgent: { label: '🚨 Urgent', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                  service: { label: '⚡ KSEB / Water', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                  general: { label: '📢 General', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                  health: { label: '🏥 Health', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
                }[n.urgency] || { label: '📢 Alert', color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb' };

                const waShareText = `${urgencyBadge.label} · ${n.title}\n\n${n.body}\n\n📍 Nammude Pailippuram:\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nammudepailippuram.vercel.app'}/announcements`;
                const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waShareText)}`;

                return (
                  <article key={n.id} className="card" style={{ padding: 16, gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            className="pill"
                            style={{
                              background: urgencyBadge.bg,
                              color: urgencyBadge.color,
                              borderColor: urgencyBadge.border,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {urgencyBadge.label}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
                            {n.title}
                          </span>
                        </div>
                        {n.title_ml && (
                          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                            {n.title_ml}
                          </div>
                        )}
                      </div>
                      <span className="small muted">
                        {formatDate(n.created_at)}
                      </span>
                    </div>

                    <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>
                      {n.body}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      <div className="small muted">
                        Audience: <strong>{n.target_audience || 'All'}</strong> · Reached:{' '}
                        <strong>{n.recipients_count ?? 0} subscriber(s)</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn light small"
                          style={{ minHeight: 32, fontSize: 12, gap: 4 }}
                        >
                          💬 Share WhatsApp
                        </a>
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => handleDeleteNotif(n.id)}
                          style={{ minHeight: 32, fontSize: 12, color: '#dc2626' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: MANAGE SUBSCRIBERS */}
        {activeTab === 'subscribers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="search"
                placeholder="Search subscriber by phone, name or area..."
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 140 }}
              >
                <option value="all">All Channels ({subscribers.length})</option>
                <option value="whatsapp">WhatsApp ({stats.whatsappCount})</option>
                <option value="phone">SMS/Call ({stats.phoneCount})</option>
                <option value="browser">Browser Push ({stats.browserCount})</option>
                <option value="email">Email ({stats.emailCount})</option>
              </select>
            </div>

            {filteredSubscribers.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '30px 16px' }}>
                <p className="muted">No subscribers match your search.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredSubscribers.map((s) => {
                  const channelIcon = {
                    whatsapp: '💬 WhatsApp',
                    phone: '📱 SMS/Call',
                    browser: '🔔 Browser Push',
                    email: '✉️ Email',
                  }[s.contact_type] || s.contact_type;

                  return (
                    <div
                      key={s.id}
                      className="card"
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 200, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--ink)' }}>
                            {s.target}
                          </span>
                          <span className="pill small">{channelIcon}</span>
                          {s.status === 'unsubscribed' && (
                            <span className="pill small" style={{ background: '#fee2e2', color: '#991b1b' }}>
                              Opted Out
                            </span>
                          )}
                        </div>
                        <div className="small muted" style={{ marginTop: 2 }}>
                          {s.name && <span>Name: <strong>{s.name}</strong> · </span>}
                          {s.area && <span>Area: <strong>{s.area}</strong> · </span>}
                          Subscribed: {formatDate(s.created_at)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {s.contact_type === 'whatsapp' && (
                          <a
                            href={`https://wa.me/${s.target.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn light small"
                            style={{ minHeight: 32, fontSize: 12 }}
                          >
                            Open Chat
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => handleDeleteSub(s.id, s.target)}
                          style={{ minHeight: 32, fontSize: 12, color: '#dc2626' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
