import { useMemo } from 'react';

/**
 * Hook para padronizar a base da API no frontend.
 * Prioriza REACT_APP_API_URL e faz fallback para "/api" em setups com proxy.
 * Em desenvolvimento local (CRA na porta 3000), força uso de "/api".
 */
export default function useApiBase() {
  const raw = process.env.REACT_APP_API_URL;
  return useMemo(() => {
    const isDevLocal = typeof window !== 'undefined' && window.location && window.location.port === '3000';
    if (isDevLocal) {
      return '/api';
    }
    const env = raw && raw.trim();
    if (env) {
      const isAbsUrl = /^https?:\/\//i.test(env);
      const isAbsPath = env.startsWith('/');
      if (isAbsUrl || isAbsPath) {
        return env.replace(/\/$/, '');
      }
      try { console.warn('[useApiBase] REACT_APP_API_URL inválido:', env, '— fallback para /api'); } catch {}
    }
    // Fallback comum quando há proxy reverso (ex.: Caddy/Nginx) apontando /api para o backend
    return '/api';
  }, [raw]);
}