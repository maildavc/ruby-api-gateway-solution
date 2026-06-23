import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";

export interface TenantInfo {
  tenantId: string;
  tenantName: string;
  email: string;
}

/**
 * Hook to get and manage the current tenant context
 * Extracts tenant info from NextAuth session
 */
export function useTenant(): TenantInfo | null {
  const { data: session } = useSession();

  // TODO: Update this based on your session structure
  // For now, returning null - you'll need to adjust based on how you store tenant info in the session
  if (!session) return null;

  return {
    tenantId: (session as any)?.user?.tenantId || "",
    tenantName: (session as any)?.user?.name || "",
    email: (session as any)?.user?.email || "",
  };
}

/**
 * Hook for loading state management during API calls
 */
export function useApiLoading(initialState = false) {
  const [loading, setLoading] = useState(initialState);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        return await fn();
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "An error occurred";
        setError(errorMessage);
        console.error("API Error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, withLoading };
}
