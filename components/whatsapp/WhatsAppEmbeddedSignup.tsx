'use client';

import { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface WhatsAppEmbeddedSignupProps {
  tenantId?: string | null;
  businessName?: string | null;
  variant?: 'primary' | 'compact' | 'light';
  buttonText?: string;
  onSuccess?: (data: { waba_id: string; phone_number_id: string; display_phone_number?: string }) => void;
  onError?: (errorMessage: string) => void;
}

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
    __waSessionInfo?: {
      phone_number_id?: string;
      waba_id?: string;
    };
  }
}

export default function WhatsAppEmbeddedSignup({
  tenantId,
  businessName = '',
  variant = 'primary',
  buttonText = 'Connect Official WhatsApp with Meta',
  onSuccess,
  onError,
}: WhatsAppEmbeddedSignupProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initFb = useCallback(() => {
    if (typeof window !== 'undefined' && window.FB) {
      try {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID || '1635701210878081',
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v21.0',
        });
        setSdkReady(true);
        console.log('[Meta Embedded Signup] FB.init initialized successfully.');
      } catch (err) {
        console.error('[Meta Embedded Signup] FB.init error:', err);
      }
    }
  }, []);

  useEffect(() => {
    // 1. Set global fbAsyncInit hook
    if (typeof window !== 'undefined') {
      window.fbAsyncInit = function () {
        initFb();
      };
      if (window.FB) {
        initFb();
      }
    }

    // 2. Session Info Listener for WhatsApp Embedded Signup
    const handleSessionMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload && payload.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('[Meta Embedded Signup] Received session info:', payload.data);
          window.__waSessionInfo = {
            phone_number_id: payload.data?.phone_number_id,
            waba_id: payload.data?.waba_id,
          };
        }
      } catch (err) {
        // Non-JSON messages ignored safely
      }
    };

    window.addEventListener('message', handleSessionMessage);
    return () => window.removeEventListener('message', handleSessionMessage);
  }, [initFb]);

  const launchWhatsAppSignup = () => {
    setErrorMessage(null);

    if (typeof window === 'undefined' || !window.FB) {
      setErrorMessage('Meta SDK is still loading. Please check your internet or ad-blocker and try again.');
      return;
    }

    // Re-ensure FB is initialized right before launching
    initFb();

    setIsConnecting(true);

    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || '1090812920081216';

    // Auto-reset connecting spinner after 15 seconds if browser blocks popup
    const popupTimeout = setTimeout(() => {
      setIsConnecting(false);
      setErrorMessage('Popup did not open. Please check if your browser blocked popups for this site (check address bar).');
    }, 15000);

    try {
      // Build extras strictly matching Meta's official Embedded Signup v4 spec
      const extrasPayload: Record<string, any> = {
        version: 'v4',
      };
      if (businessName && businessName.trim()) {
        extrasPayload.setup = {
          business: {
            name: businessName.trim(),
          },
        };
      }

      console.log('[Meta Embedded Signup] Triggering FB.login with config:', configId, extrasPayload);

      window.FB.login(
        async (response: any) => {
          clearTimeout(popupTimeout);
          console.log('[Meta Embedded Signup] FB.login response:', response);

          if (response?.authResponse?.code) {
            const oauthCode = response.authResponse.code;
            const sessionInfo = window.__waSessionInfo || {};

            try {
              console.log('[Meta Embedded Signup] Exchanging code on backend...');
              const res = await fetch('/api/integrations/whatsapp/embedded-callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  code: oauthCode,
                  tenantId: tenantId,
                  wabaId: sessionInfo.waba_id,
                  phoneNumberId: sessionInfo.phone_number_id,
                }),
              });

              const result = await res.json();

              if (res.ok && result.success) {
                setConnectedNumber(result.display_phone_number || result.phone_number_id);
                if (onSuccess) {
                  onSuccess({
                    waba_id: result.waba_id,
                    phone_number_id: result.phone_number_id,
                    display_phone_number: result.display_phone_number,
                  });
                } else {
                  setTimeout(() => window.location.reload(), 1200);
                }
              } else {
                const msg = result.error || 'Failed to complete WhatsApp onboarding.';
                setErrorMessage(msg);
                if (onError) onError(msg);
              }
            } catch (err: any) {
              const msg = err.message || 'Network error communicating with server.';
              setErrorMessage(msg);
              if (onError) onError(msg);
            } finally {
              setIsConnecting(false);
            }
          } else {
            console.warn('[Meta Embedded Signup] User closed modal or cancelled auth.');
            setIsConnecting(false);
          }
        },
        {
          config_id: configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: extrasPayload,
        }
      );
    } catch (err: any) {
      clearTimeout(popupTimeout);
      setIsConnecting(false);
      console.error('[Meta Embedded Signup] Exception in FB.login:', err);
      setErrorMessage(err.message || 'Could not launch Meta login window.');
    }
  };

  // Button style variants
  const getButtonStyle = () => {
    if (variant === 'compact') {
      return {
        background: '#25D366',
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        padding: '9px 15px',
        fontSize: 13,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        cursor: isConnecting ? 'wait' : 'pointer',
        boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
        transition: 'transform 0.15s, background 0.15s',
      };
    }

    if (variant === 'light') {
      return {
        background: '#ffffff',
        color: '#128C7E',
        border: '1.5px solid #25D366',
        borderRadius: 10,
        padding: '11px 20px',
        fontSize: 13.5,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: isConnecting ? 'wait' : 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
      };
    }

    // Default primary
    return {
      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: 12,
      padding: '12px 22px',
      fontSize: 14,
      fontWeight: 800,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: isConnecting ? 'wait' : 'pointer',
      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
      transition: 'transform 0.15s, box-shadow 0.15s',
    };
  };

  return (
    <div style={{ display: 'inline-block' }}>
      {/* Load Meta Facebook JavaScript SDK */}
      <Script
        id="facebook-jssdk"
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        onLoad={initFb}
      />

      {connectedNumber ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          padding: '10px 16px',
          borderRadius: 10,
          color: '#15803d',
          fontWeight: 700,
          fontSize: 13.5,
        }}>
          <CheckCircle2 size={18} color="#16a34a" />
          <span>Connected: {connectedNumber}</span>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={launchWhatsAppSignup}
            disabled={isConnecting}
            style={getButtonStyle()}
            onMouseEnter={e => {
              if (!isConnecting) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              if (!isConnecting) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            {isConnecting ? (
              <>
                <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Connecting to Meta...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-10.416c-5.522 0-10 4.477-10 10 0 1.76.458 3.414 1.258 4.856l-1.336 4.88 5.002-1.312c1.401.764 3.003 1.196 4.706 1.196 5.523 0 10-4.478 10-10s-4.477-10-10-10z"/>
                </svg>
                <span>{buttonText}</span>
              </>
            )}
          </button>

          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#dc2626',
              fontSize: 12.5,
              fontWeight: 500,
              marginTop: 8,
              maxWidth: 420,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
