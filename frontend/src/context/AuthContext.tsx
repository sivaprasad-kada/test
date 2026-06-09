  import { createContext, useContext, useState, useEffect, ReactNode } from "react";
  import api from "../api/axios";

  export interface User {
    id: string;
    _id?: string;
    name: string;
    email: string;
    avatar?: string;
    provider?: string;
    plan?: "FREE" | "PRO";
    subscriptionStatus?: string;
    subscriptionId?: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    monthlyRedirectCount?: number;
    redirectQuotaResetDate?: string;
  }

  export interface UserLimits {
    maxLinks: number;
    maxRedirects: number;
    linkCount: number;
  }

  interface AuthContextType {
    user: User | null;
    limits: UserLimits | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
  }

  const AuthContext = createContext<AuthContextType | null>(null);

  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [limits, setLimits] = useState<UserLimits | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data.user;
        const lim = res.data.limits;
        setUser({ id: u._id || u.id, ...u });
        setLimits(lim);
      } catch {
        setUser(null);
        setLimits(null);
      }
    };

    useEffect(() => {
      const interceptor = api.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            setUser(null);
            setLimits(null);
          }
          return Promise.reject(error);
        }
      );

      (async () => {
        await refreshUser();
        setLoading(false);
      })();

      return () => {
        api.interceptors.response.eject(interceptor);
      };
    }, []);

    const login = async (email: string, password: string) => {
      await api.post("/auth/login", { email, password });
      await refreshUser();
    };

    const register = async (name: string, email: string, password: string) => {
      await api.post("/auth/register", { name, email, password });
      await refreshUser();
    };

    const logout = async () => {
      try {
        await api.post("/auth/logout");
      } catch {
        // ignore
      } finally {
        setUser(null);
        setLimits(null);
      }
    };

    return (
      <AuthContext.Provider value={{ user, limits, loading, login, register, logout, refreshUser }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
  }
