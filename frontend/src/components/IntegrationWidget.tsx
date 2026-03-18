'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';

/**
 * Extracts the src URL from a script tag string.
 * e.g. '<script src="https://..."></script>' -> 'https://...'
 */
function extractScriptSrc(script: string): string | null {
  if (!script || typeof script !== 'string') return null;
  const match = script.match(/src\s*=\s*["']([^"']+)["']/i);
  return match ? match[1].trim() : null;
}

/**
 * IntegrationWidget
 * Fetches the integration script for the current user's role and injects it into the page.
 * Widget appears when the logged-in user has an integration configured for their role.
 */
export default function IntegrationWidget() {
  const { user } = useAuth();
  const [scriptSrc, setScriptSrc] = React.useState<string | null>(null);
  const injectedRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!user?.role) {
      setScriptSrc(null);
      return;
    }

    let cancelled = false;

    apiClient
      .get<{ success: boolean; integration: { script?: string } | null }>('/integration/me')
      .then(({ data }) => {
        if (cancelled || !data?.integration?.script) return;
        const src = extractScriptSrc(data.integration.script);
        if (src) setScriptSrc(src);
      })
      .catch(() => {
        if (!cancelled) setScriptSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  useEffect(() => {
    if (!scriptSrc) return;

    // Avoid duplicate injection (e.g. on re-render)
    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) return;

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    document.body.appendChild(script);
    injectedRef.current = script;

    return () => {
      if (injectedRef.current && injectedRef.current.parentNode) {
        injectedRef.current.parentNode.removeChild(injectedRef.current);
        injectedRef.current = null;
      }
    };
  }, [scriptSrc]);

  return null;
}
