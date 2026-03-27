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
          const found = data.find((a: any) => String(a.email || '').trim().toLowerCase() === normalizedEmail);
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
