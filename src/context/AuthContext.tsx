import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { loginUser, logoutUser, refreshTokens, registerUser } from "../api/authApi";

const REFRESH_TOKEN_KEY = "sinley_refresh_token";

interface SessionUser {
  id: string;
  username: string;
}

interface AuthContextValue {
  status: "loading" | "authenticated" | "unauthenticated";
  user: SessionUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Decodifica (sin verificar) el payload de un JWT para leer sub/username localmente. */
function decodeAccessToken(token: string): SessionUser | null {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
    return { id: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const applySession = useCallback((newAccessToken: string, newRefreshToken: string, sessionUser: SessionUser) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(sessionUser);
    setStatus("authenticated");
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setStatus("unauthenticated");
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  // Al cargar la app, si hay un refresh token guardado, se intenta recuperar la sesión.
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) {
      setStatus("unauthenticated");
      return;
    }
    refreshTokens(storedRefreshToken)
      .then((tokens) => {
        const decoded = decodeAccessToken(tokens.accessToken);
        if (!decoded) throw new Error("Token inválido");
        applySession(tokens.accessToken, tokens.refreshToken, decoded);
      })
      .catch(() => clearSession());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginUser({ email, password });
      applySession(result.accessToken, result.refreshToken, { id: result.user.id, username: result.user.username });
    },
    [applySession]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const result = await registerUser({ username, email, password });
      applySession(result.accessToken, result.refreshToken, { id: result.user.id, username: result.user.username });
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch {
        // Si falla la llamada (red caída, token ya expirado...) igualmente
        // cerramos sesión localmente: para el usuario el resultado es el mismo.
      }
    }
    clearSession();
  }, [refreshToken, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, accessToken, login, register, logout }),
    [status, user, accessToken, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
}
