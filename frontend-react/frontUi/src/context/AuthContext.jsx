import React, { useEffect, createContext, useState } from "react";
import api from "../api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    } catch (e) {
      console.error("Logout error", e);
    }
    setUsername(null);
    setIsLoggedIn(false);
   
    window.location.href = "/login";
  };


  useEffect(() => {
    const initAuth = async () => {
      try {
        await api.get("/csrf/"); 
        const res = await api.get("/protected/");

        setUsername(res.data.name);
        setIsLoggedIn(true);
      } catch {
        setUsername(null);
        setIsLoggedIn(false);
      }
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

