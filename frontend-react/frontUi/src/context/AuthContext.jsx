import React, { useEffect, createContext, useState } from "react";
import api, {setLogoutHandler} from "../api"

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState(null);

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

      // 2. Save da tokens
      setAuthTokens(res.data);
      localStorage.setItem("tokens", JSON.stringify(res.data));

      // 3. Fetch user info from backend
      const user_response = await api.get( "/protected/")
      console.log(user_response.data);
      setUsername(user_response.data.name);
      setIsLoggedIn(true);

    } catch (error) {
        throw(error);
    }
  };

  const logout = () => {
    setAuthTokens(null);
  
    window.location.href = '/login';
    localStorage.removeItem("tokens");

    setIsLoggedIn(false);
    setUsername(null);

  };

  useEffect(() => {
    setLogoutHandler(logout);
    if (isLoggedIn && !username) {
      const fetchUser = async () => {
        try {
          const user_response = await api.get("/protected/");
          setUsername(user_response.data.name)
        } catch (error) {
          console.errer("failed to catch user info")
        }
        }
        fetchUser();
    }

    }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, authTokens, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
