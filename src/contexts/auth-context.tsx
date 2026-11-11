import { authApi, type LoginInput, type RegisterInput } from "@/api/auth";
import {
  clearSession,
  onSessionChange,
  refreshSession,
  setSession,
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
};

type AuthState = Pick<AuthContextType, "status" | "user">;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    const unsubscribe = onSessionChange((user) =>
      setState(
        user
          ? { status: "authenticated", user }
          : { status: "unauthenticated", user: null },
      ),
    );

    // Restore the session from the httpOnly refresh cookie on first load.
    refreshSession().catch(() => clearSession());

    return unsubscribe;
  }, []);

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
      value={{ ...state, login, register, loginWithGoogle, logout }}
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
