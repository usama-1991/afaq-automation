import { useState } from 'react';

export function createMemoryState() {
  const cache: Record<string, any> = {};

  return function useMemoryState<T>(
    key: string,
    initialValue: T
  ): [T, (val: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(() => {
      if (cache[key] !== undefined) return cache[key] as T;
      return initialValue;
    });
    
    const setMemoryState = (val: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof val === 'function' ? (val as any)(prev) : val;
        cache[key] = next;
        return next;
      });
    };
    
    return [state, setMemoryState];
  };
}
