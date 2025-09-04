import React, { useEffect, createContext, useState } from "react";
import api, {setLogoutHandler} from "../api"

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() => {
    const tokens = localStorage.getItem("tokens");
    return tokens ? JSON.parse(tokens) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(()=> {
    return Boolean(localStorage.getItem("tokens"));
  });

  const login = async (username, password) => {
    try {
      // 1. Send login request
      const res = await api.post("/token/", {
        username,
        password,
      });

      // 2. Save tokens
      setAuthTokens(res.data);
      localStorage.setItem("tokens", JSON.stringify(res.data));

      // 3. Fetch user info from backend
      const profile = await api.get( "/protected/")
        
      console.log(profile);
      
      setIsLoggedIn(true);

    } catch (error) {
        throw(error);
    }
  };

  const logout = () => {
    setAuthTokens(null);
  
    localStorage.removeItem("tokens");
    setIsLoggedIn(false);
    window.location.href = '/login';
  };

  useEffect(() => {
    setLogoutHandler(logout);
    }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, authTokens, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
