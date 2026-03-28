import { useEffect, useState } from 'react';

export function useApprovedAffiliate(email: string | null | undefined) {
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setAffiliate(null);
      return;
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    setLoading(true);
    fetch(`/api/affiliates`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const matches = data.filter((a: any) => String(a.email || '').trim().toLowerCase() === normalizedEmail);
          const found =
            matches.find((a: any) => String(a.status || '').toLowerCase() === 'approved' && String(a.ref_code || '').trim()) ||
            matches.find((a: any) => String(a.status || '').toLowerCase() === 'approved') ||
            matches.find((a: any) => String(a.ref_code || '').trim()) ||
            matches[0];
          setAffiliate(found || null);
        } else {
          setAffiliate(null);
        }
      })
      .catch(() => setAffiliate(null))
      .finally(() => setLoading(false));
  }, [email]);

  return { affiliate, loading };
}
