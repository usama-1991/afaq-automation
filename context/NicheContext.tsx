'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { getNiche, NicheConfig } from '@/lib/niches';

interface NicheCtx {
  nicheId: string;
  niche: NicheConfig;
  setNicheId: (id: string) => void;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  hydrated: boolean;
}

const Ctx = createContext<NicheCtx | null>(null);

export function NicheProvider({ children }: { children: ReactNode }) {
  const [nicheId, setNicheIdState] = useState('restaurant');
  const [onboarded, setOnboardedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Only runs client-side — safe from SSR crash
    try {
      const stored = localStorage.getItem('ittisalo_niche');
      const ob = localStorage.getItem('ittisalo_onboarded');
      if (stored) setNicheIdState(stored);
      if (ob === 'true') setOnboardedState(true);
    } catch (_) {}
    setHydrated(true); // signal: localStorage has been read
  }, []);

  const setNicheId = useCallback((id: string) => {
    setNicheIdState(id);
    try { localStorage.setItem('ittisalo_niche', id); } catch (_) {}
  }, []);

  const setOnboarded = useCallback((v: boolean) => {
    setOnboardedState(v);
    try { localStorage.setItem('ittisalo_onboarded', String(v)); } catch (_) {}
  }, []);

  const niche = useMemo(() => getNiche(nicheId), [nicheId]);

  const value = useMemo(() => ({
    nicheId,
    niche,
    setNicheId,
    onboarded,
    setOnboarded,
    hydrated
  }), [nicheId, niche, setNicheId, onboarded, setOnboarded, hydrated]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useNiche() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNiche must be inside NicheProvider');
  return ctx;
}
