'use client';

import { useState, useEffect } from 'react';

interface Branding {
  appName: string;
  logoUrl: string | null;
}

const DEFAULT_BRANDING: Branding = {
  appName: 'Wanderlust',
  logoUrl: null,
};

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site-settings?key=app_branding')
      .then(res => res.json())
      .then(data => {
        if (data.value && typeof data.value === 'object') {
          setBranding({ ...DEFAULT_BRANDING, ...data.value });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { branding, loading };
}
