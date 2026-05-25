import { useCallback, useEffect, useState } from "react";

export function useApiData(loadData, deps = [], defaultValue = []) {
  const [data, setData] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadData();
        if (isActive) setData(result);
      } catch (err) {
        if (isActive) setError(err);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    run();

    return () => {
      isActive = false;
    };
  }, [loadData, reloadKey, ...deps]);

  return { data, isLoading, error, reload };
}
