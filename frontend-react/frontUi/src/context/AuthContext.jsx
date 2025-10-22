import React, { useEffect, createContext, useState } from "react";
import api from "../api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  const login = async (username, password) => {
    try {
  
      await api.get("/csrf/");
      await api.post("/login/", { username, password }); 

      const user_response = await api.get("/protected/");

      setUsername(user_response.data.name);
      setIsLoggedIn(true);
    } catch (error) {
      setUsername(null);
      setIsLoggedIn(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout/");
    } catch (err) {
      console.error("Logout error", err);
    }

    setUsername(null);
    setIsLoggedIn(false);
    setJustLoggedOut(true);

    window.location.href = "/login";
  };


  useEffect(() => {
    if (justLoggedOut) return; 

    const initAuth = async () => {
      try {
        await api.get("/csrf/");
        const res = await api.get("/protected/");
        setUsername(res.data.name);
        setIsLoggedIn(true);
      } catch (err) {
        setUsername(null);
        setIsLoggedIn(false);
      }
    };

    initAuth();
  }, [justLoggedOut]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

