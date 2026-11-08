import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setCustomHeadersGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  province?: string | null;
  avatarUrl?: string | null;
  birthday?: string | null;
  tagline?: string | null;
  gender?: string | null;
  genderCustom?: string | null;
  authProvider?: string | null;
  isGuest?: boolean | null;
  agreedToTerms?: boolean | null;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "zei_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyUser = (u: AuthUser | null) => {
    if (u) {
      setCustomHeadersGetter(() => ({ "x-user-id": u.id }));
    } else {
      setCustomHeadersGetter(null);
    }
    setUser(u);
  };

  useEffect(() => {
    let storedUser: AuthUser | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        storedUser = JSON.parse(stored);
        applyUser(storedUser);
      }
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
    setIsLoading(false);

    if (storedUser) {
      fetch("/api/auth/me", {
        headers: { "x-user-id": storedUser.id },
      }).then(async (res) => {
        if (!res.ok) return;
        const fresh: AuthUser = await res.json();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        applyUser(fresh);
      }).catch(() => {
        // Network error — use cached data
      });
    }
  }, []);

  const login = (u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    applyUser(u);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    applyUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
