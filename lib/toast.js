// Toast notification utility for Nammude Pailippuram
// Dispatches immediate visual feedback events across the client app and supports flash toasts.

const FLASH_TOAST_KEY = 'pailippuram_flash_toast';

/**
 * Triggers an immediate toast notification.
 * @param {string | { message: string, sub?: string, type?: 'success' | 'error' | 'info', duration?: number }} options
 * @param {string} [sub] Optional subtitle if first argument is a string message
 */
export function showToast(options, sub) {
  if (typeof window === 'undefined') return;

  let detail = {
    type: 'success',
    duration: 3500,
  };
  if (typeof options === 'string') {
    detail.message = options;
    if (sub) detail.sub = sub;
  } else if (options && typeof options === 'object') {
    detail = {
      ...detail,
      ...options,
    };
  }

  if (!detail.message) return;

  window.dispatchEvent(
    new CustomEvent('app-toast', {
      detail,
    })
  );
}

/**
 * Stores a toast to be displayed on the next page view or after a navigation.
 * @param {string | { message: string, sub?: string, type?: 'success' | 'error' | 'info', duration?: number }} options
 * @param {string} [sub]
 */
export function setFlashToast(options, sub) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;

  let detail = { type: 'success', duration: 3500 };
  if (typeof options === 'string') {
    detail.message = options;
    if (sub) detail.sub = sub;
  } else if (options && typeof options === 'object') {
    detail = { ...detail, ...options };
  }

  try {
    window.sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify(detail));
  } catch {
    // ignore
  }
}

/**
 * Retrieves and clears any pending flash toast.
 */
export function popFlashToast() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(FLASH_TOAST_KEY);
    if (raw) {
      window.sessionStorage.removeItem(FLASH_TOAST_KEY);
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}
