import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
  loginAccount,
  registerAccount,
  setStoredToken,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadUser() {
      if (!getStoredToken()) {
        setBootstrapping(false);
        return;
      }
      try {
        const currentUser = await fetchCurrentUser();
        if (isActive) {
          setUser(currentUser);
        }
      } catch {
        if (isActive) {
          clearStoredToken();
          setUser(null);
        }
      } finally {
        if (isActive) {
          setBootstrapping(false);
        }
      }
    }

    loadUser();
    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      bootstrapping,
      user,
      isAuthenticated: Boolean(user),
      async login(payload) {
        const data = await loginAccount(payload);
        setStoredToken(data.access_token);
        setUser(data.user);
        return data.user;
      },
      async register(payload) {
        const data = await registerAccount(payload);
        setStoredToken(data.access_token);
        setUser(data.user);
        return data.user;
      },
      logout() {
        clearStoredToken();
        setUser(null);
      },
    }),
    [bootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
