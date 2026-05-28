"use client"

import Script from 'next/script'
import { useMemo } from 'react'

import { usePublicGlobalSettings } from '@/contexts/PublicGlobalSettingsContext'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'

function createGtagSnippet(measurementId: string) {
  return `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);} 
gtag('js', new Date());
gtag('config', '${measurementId}');`
}

function createFacebookPixelSnippet(pixelId: string) {
  return `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
 n.callMethod.apply(n,arguments):n.queue.push(arguments)};
 if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
 n.queue=[];t=b.createElement(e);t.async=!0;
 t.src=v;s=b.getElementsByTagName(e)[0];
 s.parentNode.insertBefore(t,s)}(window, document,'script',
 'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`
}

/**
 * PublicScriptsInjector injecte les scripts analytics et les custom scripts "safe" depuis les réglages globaux.
 */
export default function PublicScriptsInjector() {
  const { data } = usePublicGlobalSettings()
  const { privacyPrefs } = useUserPreferences()

  const gaId = useMemo(() => (data?.analytics?.googleAnalyticsId ?? '').trim(), [data?.analytics?.googleAnalyticsId])
  const pixelId = useMemo(() => (data?.analytics?.facebookPixelId ?? '').trim(), [data?.analytics?.facebookPixelId])

  if (!privacyPrefs.analyticsEnabled) {
    return null
  }

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="ga-gtag" strategy="afterInteractive">
            {createGtagSnippet(gaId)}
          </Script>
        </>
      ) : null}

      {pixelId ? (
        <Script id="fb-pixel" strategy="afterInteractive">
          {createFacebookPixelSnippet(pixelId)}
        </Script>
      ) : null}
    </>
  )
}
