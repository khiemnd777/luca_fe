import * as React from "react";

/*
* Example usage:
*   const { data, loading } = useAsync(() => api.getOrder(id), [id]);
*/
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (err: any) => void;
  }
) {
  const { onSuccess, onError } = options ?? {};
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [data, setData] = React.useState<T | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn();
        if (!cancelled) {
          setData(result);
          onSuccess?.(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          onError?.(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, deps);

  const reload = React.useCallback(() => asyncFn(), deps);

  return { data, loading, error, reload, setData };
}
