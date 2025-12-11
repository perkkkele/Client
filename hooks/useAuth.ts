import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const saved = await SecureStore.getItemAsync("token");
        setToken(saved);
      } catch (e) {
        console.log("Error leyendo token", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { token, loading };
}
