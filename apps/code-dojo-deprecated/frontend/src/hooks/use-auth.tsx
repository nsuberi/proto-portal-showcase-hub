import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type User } from "@/api/client";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; errors?: string[] }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["auth"] });
      }
      return res;
    },
    [queryClient]
  );

  const signup = useCallback(
    async (email: string, password: string, confirmPassword: string) => {
      const res = await authApi.signup(email, password, confirmPassword);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["auth"] });
      }
      return res;
    },
    [queryClient]
  );

  const logoutFn = useCallback(async () => {
    await authApi.logout();
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        isAuthenticated: data?.authenticated ?? false,
        isLoading,
        login,
        signup,
        logout: logoutFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
