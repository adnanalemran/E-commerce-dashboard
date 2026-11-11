import { authApi, type LoginInput, type RegisterInput } from "@/api/auth";
import { profileApi } from "@/api/profile";
import { queryClient } from "@/api/query-client";
import {
  clearSession,
  onSessionChange,
  refreshSession,
  setSession,
  updateSessionUser,
} from "@/api/client";
import type { AuthUser } from "@/api/types";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextType = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  loginWithGoogle: (idToken: string, rememberMe?: boolean) => Promise<AuthUser>;
  /** Ends the current session (and every session when `allDevices` is set). */
  logout: (options?: { allDevices?: boolean }) => Promise<void>;
  /** Replaces the cached user after a profile change. */
  updateUser: (user: AuthUser) => void;
};

type AuthState = Pick<AuthContextType, "status" | "user">;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    const unsubscribe = onSessionChange((user) => {
      // Never show one account's cached data to the next.
      if (!user) queryClient.clear();
      setState(
        user
          ? { status: "authenticated", user }
          : { status: "unauthenticated", user: null },
      );
    });

    // Restore the session from the httpOnly refresh cookie on first load.
    refreshSession().catch(() => clearSession());

    return unsubscribe;
  }, []);

  // Re-read the account when the tab regains focus so role or status changes
  // made by an admin apply without a full reload (at most once a minute).
  const isAuthenticated = state.status === "authenticated";
  useEffect(() => {
    if (!isAuthenticated) return;
    let lastSync = Date.now();

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastSync < 60_000) return;
      lastSync = Date.now();
      profileApi
        .get()
        .then(updateSessionUser)
        .catch(() => {
          // A failed refresh is handled by the API client (sign-out on 401).
        });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAuthenticated]);

  const login = async (input: LoginInput) => {
    const session = await authApi.login(input);
    setSession(session);
    return session.user;
  };

  const register = async (input: RegisterInput) => {
    const session = await authApi.register(input);
    setSession(session);
    return session.user;
  };

  const loginWithGoogle = async (idToken: string, rememberMe = false) => {
    const session = await authApi.google(idToken, rememberMe);
    setSession(session);
    return session.user;
  };

  const logout = async ({ allDevices = false } = {}) => {
    try {
      await (allDevices ? authApi.logoutAll() : authApi.logout());
    } catch {
      // Sign out locally even when the server call fails.
    } finally {
      clearSession({ broadcast: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser: updateSessionUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
