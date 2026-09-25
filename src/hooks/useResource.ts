import { useCallback, useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../lib/api";

export const useResource = <T,>(
  endpoint: string,
  selector: (data: any) => T,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(endpoint);
      setData(selector(response.data));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [endpoint, selector]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
};
