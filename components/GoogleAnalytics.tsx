'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function GoogleAnalytics() {
  const [gaTrackingId, setGaTrackingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/site-settings?key=google_analytics')
      .then(res => res.json())
      .then(data => {
        if (data.value?.trackingId) {
          setGaTrackingId(data.value.trackingId);
        }
      })
      .catch(console.error);
  }, []);

  if (!gaTrackingId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaTrackingId}');
        `}
      </Script>
    </>
  );
}
