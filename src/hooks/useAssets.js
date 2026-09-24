import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/index.js';

export function useAssets(user) {
  const [data, setData] = useState({ assignedToMe: [], otherVisible: [], scope: 'own' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.listAssets(user));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...data, loading, error, refresh };
}
