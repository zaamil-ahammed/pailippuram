'use client';
import { useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import { supabase } from '../../../lib/supabase';

const TABLES = ['categories', 'listings', 'bus_routes', 'donors', 'panchayath_items', 'announcements', 'submissions'];

export default function Backup() {
  const [msg, setMsg] = useState('');

  async function download() {
    setMsg('Preparing...');
    const out = { exported_at: new Date().toISOString() };
    for (const t of TABLES) {
      const { data, error } = await supabase.from(t).select('*');
      if (error) return setMsg(`Could not read ${t}. Nothing was saved.`);
      out[t] = data;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pailippuram-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Done. Keep the file somewhere safe. This file contains private submission contacts, so do not share it.');
  }

  return (
    <div className="page">
      <PageHeader title="Export a backup" back="/admin" backLabel="Admin" />
      <main className="body">
        <p>The free database plan has no real backups. Download this file once a week and keep it safe.</p>
        <button type="button" className="btn dark big" onClick={download}>Download backup</button>
        {msg ? <p className="note">{msg}</p> : null}
      </main>
    </div>
  );
}
