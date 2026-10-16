import { supabase } from './supabase';

// Records one admin action in the activity log. Never blocks the action if logging fails.
export async function logAudit(user, { action, table, rowId, note, changes }) {
  try {
    await supabase.from('audit_logs').insert({
      admin_id: user?.id,
      admin_email: user?.email,
      action,
      table_name: table,
      row_id: rowId ? String(rowId) : null,
      note: note || null,
      changes: changes || null,
    });
  } catch {
    /* the log is best-effort */
  }
}
