'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const setNicheId = (id: string) => {
    setNicheIdState(id);
    try { localStorage.setItem('ittisalo_niche', id); } catch (_) {}
  };

  const setOnboarded = (v: boolean) => {
    setOnboardedState(v);
    try { localStorage.setItem('ittisalo_onboarded', String(v)); } catch (_) {}
  };

  return (
    <Ctx.Provider value={{ nicheId, niche: getNiche(nicheId), setNicheId, onboarded, setOnboarded, hydrated }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNiche() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNiche must be inside NicheProvider');
  return ctx;
}
