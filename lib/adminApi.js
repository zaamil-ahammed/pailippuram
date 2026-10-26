import { memoryStore } from './mockStore.js';

// Performs authenticated database mutations (insert, update, delete) via the server-side API route.
// Bypasses browser-side RLS constraints using the service role key and keeps client-side mockStore synchronized.
export async function adminMutate({ action, table, id, data }) {
  try {
    const res = await fetch('/api/admin/mutate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, table, id, data }),
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json.success) {
      // Sync into client-side memoryStore & localStorage
      try {
        const localTable = memoryStore.getTable(table);
        if (action === 'insert' && json.data) {
          const existIdx = localTable.findIndex((r) => String(r.id) === String(json.data.id));
          if (existIdx >= 0) localTable[existIdx] = json.data;
          else localTable.unshift(json.data);
          memoryStore.saveToStorage();
        } else if (action === 'update' && json.data) {
          const existIdx = localTable.findIndex((r) => String(r.id) === String(id));
          if (existIdx >= 0) localTable[existIdx] = { ...localTable[existIdx], ...json.data };
          else localTable.unshift(json.data);
          memoryStore.saveToStorage();
        } else if (action === 'delete' && id) {
          memoryStore.tables[table] = localTable.filter((r) => String(r.id) !== String(id));
          memoryStore.saveToStorage();
        }
      } catch {
        // ignore client store sync errors
      }

      return { data: json.data || null, error: null };
    }

    // Server returned error
    const errMsg = json.error || 'Server mutation failed';
    console.error(`[adminMutate] API returned error on ${table}:`, errMsg);
    return { data: null, error: { message: errMsg } };
  } catch (netErr) {
    console.error(`[adminMutate] Network error on ${table}:`, netErr);
    return { data: null, error: { message: netErr.message || 'Network error saving changes' } };
  }
}
