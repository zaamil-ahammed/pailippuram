// Unified share and clipboard helper for Nammude Pailippuram

export async function copyToClipboard(text) {
  if (!text) return false;
  
  // 1. Modern Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API write failed, falling back:', err);
    }
  }

  // 2. Fallback for iOS Safari / iframe permissions
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}

export function notifyToast(message, sub) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: { message, sub },
      })
    );
  }
}

/**
 * Shares an item or service. Copies link to clipboard and calls navigator.share if available.
 * @param {Object} options
 * @param {string} options.title - The title (e.g. shop name or page)
 * @param {string} options.text - Optional short summary or phone number
 * @param {string} [options.url] - The direct URL
 */
export async function shareServiceOrApp({ title, text, url }) {
  const finalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  // Copy direct link to clipboard immediately
  const copied = await copyToClipboard(finalUrl);
  
  if (copied) {
    notifyToast(
      'Link copied to clipboard!',
      'ലിങ്ക് കോപ്പി ചെയ്തു'
    );
  }

  // If native share sheet is available (mobile Chrome, Safari, Android, iOS), trigger it
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: title || 'Nammude Pailippuram',
        text: text ? `${text}\n` : undefined,
        url: finalUrl,
      });
      return { method: 'share', success: true };
    } catch (err) {
      // User cancelled native share sheet; link is already copied
      if (err.name !== 'AbortError') {
        console.debug('Navigator share note:', err);
      }
    }
  }

  return { method: 'clipboard', success: copied };
}
