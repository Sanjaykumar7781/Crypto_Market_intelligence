import { useEffect, useState } from 'react';

export function useAsync(factory, deps = [], intervalMs = 0) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await factory();
        if (mounted) setState({ data, loading: false, error: null });
      } catch (error) {
        if (mounted) setState((current) => ({ ...current, loading: false, error }));
      }
    }

    load();
    const interval = intervalMs ? setInterval(load, intervalMs) : null;

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  // Callers pass route-specific dependencies so polling does not restart on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
