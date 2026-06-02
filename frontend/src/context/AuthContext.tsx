  import { createContext, useContext, useState, useEffect, ReactNode } from "react";
  import api from "../api/axios";

  interface User {
    id: string;
    _id?: string; // optional property
    name: string;
    email: string;
    avatar?: string; // this is also a optional property
    provider?: string;
  }

  interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
  }

  const AuthContext = createContext<AuthContextType | null>(null);

  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data.user;
        setUser({ id: u._id || u.id, ...u });
      } catch {
        setUser(null);
      }
    };

    useEffect(() => {
      const interceptor = api.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            setUser(null);
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
      const res = await api.post("/auth/login", { email, password });
      const u = res.data.user;
      setUser({ id: u._id || u.id, ...u });
    };

    const register = async (name: string, email: string, password: string) => {
      const res = await api.post("/auth/register", { name, email, password });
      const u = res.data.user;
      setUser({ id: u._id || u.id, ...u });
    };

    const logout = async () => {
      try {
        await api.post("/auth/logout");
      } catch {
        // ignore
      } finally {
        setUser(null);
      }
    };

    return (
      <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
  }
