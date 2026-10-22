// Lightweight floating toast notification system for administrative actions
export function showToast({ type = 'info', message = '', sub = '', duration = 3500 } = {}) {
  if (typeof document === 'undefined') return;

  let container = document.getElementById('app-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'app-toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    pointer-events: auto;
    background: #1e293b;
    color: #ffffff;
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13.5px;
    line-height: 1.4;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateY(12px) scale(0.96);
    opacity: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const bgMap = {
    success: '#065f46',
    error: '#991b1b',
    warning: '#92400e',
    info: '#1e293b',
  };

  const iconEl = document.createElement('span');
  iconEl.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: ${bgMap[type] || bgMap.info};
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
    margin-top: 1px;
  `;
  iconEl.textContent = iconMap[type] || 'ℹ️';

  const textWrap = document.createElement('div');
  textWrap.style.cssText = 'flex: 1; min-width: 0;';

  const msgEl = document.createElement('div');
  msgEl.style.cssText = 'font-weight: 700; color: #f8fafc;';
  msgEl.textContent = message;
  textWrap.appendChild(msgEl);

  if (sub) {
    const subEl = document.createElement('div');
    subEl.style.cssText = 'font-size: 12px; color: #94a3b8; margin-top: 2px; word-break: break-word;';
    subEl.textContent = sub;
    textWrap.appendChild(subEl);
  }

  toast.appendChild(iconEl);
  toast.appendChild(textWrap);
  container.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0) scale(1)';
    toast.style.opacity = '1';
  });

  // Auto dismiss
  setTimeout(() => {
    toast.style.transform = 'translateY(8px) scale(0.95)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 260);
  }, duration);
}
