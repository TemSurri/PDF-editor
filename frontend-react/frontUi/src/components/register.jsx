import React, { useState } from "react";
import "./stylesheets/auth.css";
import axios from 'axios'
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const onRegister = async (data) => {
    try {
      setLoading(true);
      const response = await axios.post('http://127.0.0.1:8000/api/users/register/', data);
      console.log('Registration successful:', response.data);
      navigate('/login');
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessages = Object.entries(error.response.data)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");

        alert(`Registration failed:\n${errorMessages}`);
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setUsername('');
      setEmail('');
      setPassword('');
      setLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
  
    onRegister({ username, email, password });
  };

  return (
    <div className="auth-box">
      <h2 className="auth-title">Sign Up</h2>
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
          type="email"
          placeholder="Email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        </button> :
        <button type="submit" className="auth-btn">
          Sign Up
        </button>}
        
      </form>
    </div>
  );
};

export default Register;
