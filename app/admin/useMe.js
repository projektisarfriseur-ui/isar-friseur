'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Loads the signed-in staff member; bounces to login when the session is gone.
export function useMe() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/staff/me').then(async (r) => {
      if (r.status === 401) { router.replace('/admin/login'); return; }
      const j = await r.json();
      if (alive) setMe(j);
    });
    return () => { alive = false; };
  }, [router]);
  return me;
}
