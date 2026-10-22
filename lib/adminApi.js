import { memoryStore } from './mockStore';

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
    console.warn(`[adminMutate] API returned error on ${table}:`, errMsg);
    return { data: null, error: { message: errMsg } };
  } catch (netErr) {
    console.warn(`[adminMutate] Network error, falling back to local store:`, netErr);

    // Fallback directly to local mockStore
    try {
      const localTable = memoryStore.getTable(table);
      if (action === 'insert') {
        const newRow = {
          ...data,
          id: data.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localTable.unshift(newRow);
        memoryStore.saveToStorage();
        return { data: newRow, error: null };
      }
      if (action === 'update' && id) {
        const idx = localTable.findIndex((r) => String(r.id) === String(id));
        if (idx >= 0) {
          localTable[idx] = { ...localTable[idx], ...data, updated_at: new Date().toISOString() };
          memoryStore.saveToStorage();
          return { data: localTable[idx], error: null };
        }
      }
      if (action === 'delete' && id) {
        memoryStore.tables[table] = localTable.filter((r) => String(r.id) !== String(id));
        memoryStore.saveToStorage();
        return { data: { id }, error: null };
      }
    } catch (storeErr) {
      console.error('[adminMutate] Local store fallback error:', storeErr);
    }

    return { data: null, error: { message: netErr.message || 'Network error saving changes' } };
  }
}
