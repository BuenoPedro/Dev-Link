import { useState, useEffect, useCallback } from 'react';
import { requestManager } from '../lib/requestManager';

export function useRequestCache(key, requestFn, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { dependencies = [], cacheTime = 30000, enabled = true, onSuccess, onError } = options;

  const execute = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await requestManager.makeRequest(key, requestFn, { cacheTime });

      setData(result);
      onSuccess?.(result);
    } catch (err) {
      setError(err);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [key, requestFn, enabled, cacheTime, onSuccess, onError]);

  useEffect(() => {
    execute();
  }, [execute, ...dependencies]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch };
}
