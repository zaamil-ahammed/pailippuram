'use client';
import { useEffect, useState } from 'react';
import { notifyToast } from './share';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(
    typeof window !== 'undefined' ? window.__pwaDeferredPrompt || null : null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [canPromptDirectly, setCanPromptDirectly] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if already installed in standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(standalone);

    // 2. Check if iOS device
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIos(ios);

    // 3. Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration:', err);
      });
    }

    // 4. Capture beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.__pwaDeferredPrompt = e;
      setDeferredPrompt(e);
      setCanPromptDirectly(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__pwaDeferredPrompt = null;
      setDeferredPrompt(null);
      setCanPromptDirectly(false);
      notifyToast('App installed to your Home screen!', 'ആപ്പ് ഹോം സ്ക്രീനിൽ ഇൻസ്റ്റാൾ ചെയ്തു');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.__pwaDeferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
      setCanPromptDirectly(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerDirectInstall = async () => {
    const prompt = deferredPrompt || (typeof window !== 'undefined' ? window.__pwaDeferredPrompt : null);

    if (isInstalled) {
      notifyToast('App is already installed on your device!', 'ആപ്പ് ഇതിനകം ഇൻസ്റ്റാൾ ചെയ്തിട്ടുണ്ട്');
      return { success: true, outcome: 'already_installed' };
    }

    // Direct native prompt into homescreen!
    if (prompt && typeof prompt.prompt === 'function') {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          window.__pwaDeferredPrompt = null;
          setDeferredPrompt(null);
          setCanPromptDirectly(false);
          notifyToast('Added to Home Screen! · ഹോം സ്ക്രീനിലേക്ക് ചേർത്തു');
        }
        return { success: true, outcome: choice.outcome };
      } catch (err) {
        console.error('Error triggering native prompt:', err);
      }
    }

    // If iOS Safari
    if (isIos) {
      window.dispatchEvent(new CustomEvent('show-ios-install-guide'));
      return { success: false, reason: 'ios_guide' };
    }

    // If Chrome/Chromium but beforeinstallprompt hasn't fired yet
    // Try requesting install or guide
    window.dispatchEvent(new CustomEvent('show-install-modal-fallback'));
    return { success: false, reason: 'prompt_not_ready' };
  };

  return {
    isInstalled,
    isIos,
    canPromptDirectly,
    triggerDirectInstall,
  };
}
