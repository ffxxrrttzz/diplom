// src/components/ui/ClientOnly.tsx
'use client';

import { useState, useEffect, ReactNode } from 'react';

export default function ClientOnly({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}