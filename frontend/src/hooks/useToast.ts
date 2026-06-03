'use client';

import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  const show = useCallback((message: string, duration = 5000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  const hide = useCallback(() => setToast(null), []);

  return { toast, show, hide };
}
