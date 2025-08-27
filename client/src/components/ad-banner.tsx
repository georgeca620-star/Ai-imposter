import { useEffect, useRef } from 'react';
import { AD_CONFIG } from '@/config/ads';

interface AdBannerProps {
  adSlot: string;
  adFormat?: string;
  adStyle?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdBanner({ 
  adSlot, 
  adFormat = 'auto', 
  adStyle = { display: 'block' },
  className = ''
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only load real ads if enabled and configured
    if (!AD_CONFIG.ADS_ENABLED || AD_CONFIG.ADSENSE_CLIENT_ID === 'ca-pub-YOUR_ADSENSE_ID') {
      return;
    }

    try {
      // Load AdSense script if not already loaded
      if (!document.querySelector('script[src*="adsbygoogle"]')) {
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CONFIG.ADSENSE_CLIENT_ID}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      // Initialize ad after a short delay
      setTimeout(() => {
        if (window.adsbygoogle && adRef.current) {
          window.adsbygoogle.push({});
        }
      }, 100);
    } catch (error) {
      console.log('Ad loading failed:', error);
    }
  }, []);

  // Show demo ad if real ads not enabled
  if (!AD_CONFIG.ADS_ENABLED) {
    return <DemoAdBanner className={className} />;
  }

  return (
    <div className={`ad-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={AD_CONFIG.ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Demo/placeholder ad component for development
export function DemoAdBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-muted border border-border rounded-lg p-4 text-center ${className}`}>
      <div className="text-xs text-muted-foreground mb-2">Advertisement</div>
      <div className="bg-primary/10 rounded p-3">
        <div className="text-sm text-muted-foreground">
          🎮 Your Ad Here
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          320x50 Banner Ad Space
        </div>
      </div>
    </div>
  );
}