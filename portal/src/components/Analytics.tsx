import * as React from 'react';

interface AnalyticsProps {
  ga4Id?: string | null;
  metaPixelId?: string | null;
}

export function Analytics({ ga4Id, metaPixelId }: AnalyticsProps) {
  // Se nenhum ID estiver configurado, não injeta nada (Fase 1 do escopo)
  if (!ga4Id && !metaPixelId) return null;

  return React.createElement(React.Fragment, null,
    // --- GOOGLE ANALYTICS 4 ---
    ga4Id && React.createElement(React.Fragment, null,
      React.createElement('script', {
        src: `https://googletagmanager.com{ga4Id}`,
        async: true
      }),
      React.createElement('script', {
        dangerouslySetInnerHTML: {
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ga4Id}');
          `
        }
      })
    ),

    // --- META PIXEL ---
    metaPixelId && React.createElement(React.Fragment, null,
      React.createElement('script', {
        dangerouslySetInnerHTML: {
          __html: `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e);s.parentNode.insertBefore(t,s)}(window,document,'script','https://facebook.net');
            fbq('init', '${metaPixelId}'); fbq('track', 'PageView');
          `
        }
      }),
      React.createElement('noscript', null,
        React.createElement('img', {
          height: '1',
          width: '1',
          style: { display: 'none' },
          src: `https://facebook.com{metaPixelId}&ev=PageView&noscript=1`,
          alt: ''
        })
      )
    )
  );
}