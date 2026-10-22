'use client';
import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import { useAdmin } from '../../../components/AdminGate';

export default function Admins() {
  const { user, signOut } = useAdmin();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleUpdatePassword(e) {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');

    if (!newPassword || newPassword.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('pailippuram_admin_password', newPassword.trim());
      }
      setSavedSuccess(true);
      setMsg('Admin password updated successfully! Keep this password secure. It will be required to access the admin panel.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMsg(''), 5000);
    } catch {
      setErrorMsg('Could not save password to storage.');
    }
  }

  return (
    <div className="page">
      <PageHeader title="Admin Access & Security" ml="അഡ്മിൻ സുരക്ഷ & പാസ്‌വേഡ്" back="/admin" backLabel="Admin" />
      <main className="body" style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Active Session Card */}
        <section className="card" style={{ background: '#ffffff', border: '1.5px solid var(--card-border)', borderRadius: '18px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span className="pill" style={{ background: '#fef3c7', color: '#92400e', marginBottom: 6, display: 'inline-block' }}>
                Active Admin Session
              </span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ink)' }}>
                {user?.email || 'kl58u8090@gmail.com'}
              </h3>
              <p className="muted small" style={{ margin: '4px 0 0' }}>
                Protected with password-only administrative authorization.
              </p>
            </div>
            <button type="button" className="btn light small" onClick={signOut}>
              Sign out from this device
            </button>
          </div>
        </section>

        {/* Change Admin Password */}
        <section className="card" style={{ marginTop: '16px', background: '#ffffff', border: '1.5px solid var(--card-border)', borderRadius: '18px', padding: '20px' }}>
          <h2 style={{ fontSize: '1.15rem', margin: '0 0 6px', color: 'var(--ink)' }}>
            🔑 Change Admin Password
          </h2>
          <p className="muted small" style={{ margin: '0 0 16px', lineHeight: 1.4 }}>
            Set a custom password for the administrator panel. Once changed, any device attempting to enter <code>/admin</code> will need this password.
          </p>

          <form onSubmit={handleUpdatePassword}>
            <div className="field" style={{ marginBottom: '12px' }}>
              <label htmlFor="new-p" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                New Admin Password
              </label>
              <input
                id="new-p"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password..."
                required
                style={{ padding: '10px 12px' }}
              />
            </div>

            <div className="field" style={{ marginBottom: '16px' }}>
              <label htmlFor="conf-p" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                Confirm New Password
              </label>
              <input
                id="conf-p"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password..."
                required
                style={{ padding: '10px 12px' }}
              />
            </div>

            {errorMsg ? (
              <div style={{
                padding: '10px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#b91c1c',
                fontSize: '0.85rem',
                marginBottom: '14px',
              }}>
                ⚠️ {errorMsg}
              </div>
            ) : null}

            {msg ? (
              <div style={{
                padding: '10px 12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                color: '#166534',
                fontSize: '0.85rem',
                marginBottom: '14px',
              }}>
                ✅ {msg}
              </div>
            ) : null}

            <button type="submit" className="btn dark">
              Update Admin Password
            </button>
          </form>
        </section>

        {/* Database instructions */}
        <section className="card" style={{ marginTop: '16px', background: '#fafaf9', border: '1px solid var(--card-border)', borderRadius: '18px', padding: '18px' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 8px', color: 'var(--ink)' }}>
            Database-Level Security (Supabase)
          </h3>
          <p className="muted small" style={{ margin: '0 0 12px', lineHeight: 1.5 }}>
            To link additional cloud admin accounts in your Supabase backend:
          </p>
          <div className="steps" style={{ fontSize: '0.88rem' }}>
            <div className="step"><b>1</b><span>In Supabase Dashboard, go to <strong>Authentication &gt; Users &gt; Add user</strong>.</span></div>
            <div className="step"><b>2</b><span>Copy that user's UID.</span></div>
            <div className="step"><b>3</b><span>In the SQL Editor, execute: <code>insert into admins (user_id) values ('UID-GOES-HERE');</code></span></div>
          </div>
        </section>

      </main>
    </div>
  );
}
