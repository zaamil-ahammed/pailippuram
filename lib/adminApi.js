import { memoryStore } from './mockStore.js';

// Synchronizes updated row state into client-side memoryStore & localStorage
function syncClientStore(table, action, id, rowData) {
  try {
    const localTable = memoryStore.getTable(table);
    if (action === 'insert' && rowData) {
      const existIdx = localTable.findIndex((r) => String(r.id) === String(rowData.id));
      if (existIdx >= 0) localTable[existIdx] = rowData;
      else localTable.unshift(rowData);
      memoryStore.saveToStorage();
    } else if (action === 'update' && rowData) {
      const targetId = id || rowData.id;
      const existIdx = localTable.findIndex((r) => String(r.id) === String(targetId));
      if (existIdx >= 0) localTable[existIdx] = { ...localTable[existIdx], ...rowData };
      else localTable.unshift(rowData);
      memoryStore.saveToStorage();
    } else if (action === 'delete' && id) {
      memoryStore.tables[table] = localTable.filter((r) => String(r.id) !== String(id));
      memoryStore.saveToStorage();
    }
  } catch {
    // client store sync errors are non-fatal
  }
}

// RESTful POST: Creates a new community record
export async function createRecord(table, data) {
  try {
    const res = await fetch(`/api/admin/records?_t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
      body: JSON.stringify({ table, data }),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      syncClientStore(table, 'insert', json.data?.id, json.data);
      return { data: json.data || null, error: null };
    }

    const errMsg = json.error || `Failed to create record in ${table}`;
    return { data: null, error: { message: errMsg } };
  } catch (err) {
    return { data: null, error: { message: err.message || 'Network error creating record' } };
  }
}

// RESTful PATCH: Updates an existing community record
export async function updateRecord(table, id, data) {
  try {
    const res = await fetch(`/api/admin/records?_t=${Date.now()}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
      body: JSON.stringify({ table, id, data }),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      syncClientStore(table, 'update', id, json.data);
      return { data: json.data || null, error: null };
    }

    const errMsg = json.error || `Failed to update record in ${table}`;
    return { data: null, error: { message: errMsg } };
  } catch (err) {
    return { data: null, error: { message: err.message || 'Network error updating record' } };
  }
}

// RESTful DELETE: Deletes a community record
export async function deleteRecord(table, id) {
  try {
    const res = await fetch(`/api/admin/records?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}&_t=${Date.now()}`, {
      method: 'DELETE',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      syncClientStore(table, 'delete', id, null);
      return { data: { id, table }, error: null };
    }

    const errMsg = json.error || `Failed to delete record from ${table}`;
    return { data: null, error: { message: errMsg } };
  } catch (err) {
    return { data: null, error: { message: err.message || 'Network error deleting record' } };
  }
}

// RESTful GET: Retrieves a community record or table records
export async function getRecord(table, id) {
  try {
    const url = id
      ? `/api/admin/records?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}&_t=${Date.now()}`
      : `/api/admin/records?table=${encodeURIComponent(table)}&_t=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      return { data: json.data || null, error: null };
    }
    return { data: null, error: { message: json.error || 'Failed to fetch records' } };
  } catch (err) {
    return { data: null, error: { message: err.message || 'Network error fetching record' } };
  }
}

// Unified mutation entrypoint: Dispatches to RESTful endpoints with full backward compatibility
export async function adminMutate({ action, table, id, data }) {
  if (action === 'insert') {
    return createRecord(table, data);
  }
  if (action === 'update') {
    return updateRecord(table, id, data);
  }
  if (action === 'delete') {
    return deleteRecord(table, id);
  }
  return { data: null, error: { message: `Unknown action: ${action}` } };
}
