import React, { useState, useContext} from "react";
import "./stylesheets/auth.css";
import axios from 'axios'
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, password); // ✅ wait for login to finish
      navigate('/')
    }
     catch (error) {
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert("Login failed. Please try again.");
      }
    } finally {
      setLoading(false); // ✅ stop loading after login finishes (success or fail)
    }
  };

  return (
    <div className="auth-box">
      <h2 className="auth-title">Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          className="auth-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {loading ? <button type="submit" className="auth-btn" disabled>
          Loading
        </button> : <button type="submit" className="auth-btn">
          Sign In
        </button>}
        
      </form>
    </div>
  );
};

export default Login;
