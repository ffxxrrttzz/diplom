'use client';

import { useState, useEffect, ReactNode } from 'react';

export default function ClientOnly({ 
  children, 
  fallback = <div className="animate-pulse bg-zinc-800 h-6 w-full rounded" /> 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : <>{fallback}</>;
}