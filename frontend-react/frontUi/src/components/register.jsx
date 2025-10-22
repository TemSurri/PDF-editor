import React, { useState } from "react";
import "./stylesheets/auth.css";

import { useNavigate } from "react-router-dom";
import api from "../api";


const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [pass_error, setPassError] = useState(false);
  const [mail_error, setEmailError] = useState(false);
  const [name_error, setNameError] = useState(false);

  const [error, setError] = useState(false)
  
  const onRegister = async (data) => {
    try {
      setLoading(true);
      const response = await api.post('/register/', data);
      console.log('Registration successful:', response.data);
      navigate('/login');

    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessages = error.response.data

        if (errorMessages.email) {
          setEmailError(errorMessages.email)
        }
        if (errorMessages.password) {
          setPassError(errorMessages.password)
        }
        if (errorMessages.username) {
          setNameError(errorMessages.username)
        }
        console.log(errorMessages);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      
    } finally {   
      setLoading(false);
      
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
  
    onRegister({ username, email, password });
  };

  return (
    <div className="auth-box">
      {error && (error)}
      <h2 className="auth-title">Sign Up</h2>
      <form onSubmit={handleSubmit}>
        {name_error && (name_error)}
        <input
          type="text"
          placeholder="Username"
          className="auth-input"
          value={username}
          onChange={(e) => {setUsername(e.target.value); setNameError(false)}}
          required
        />
        {mail_error && (mail_error)}
        <input
          type="email"
          placeholder="Email"
          className="auth-input"
          value={email}
          onChange={(e) => {setEmail(e.target.value); setEmailError(false) }}
          required
        />
        {pass_error && (pass_error)}
        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => {setPassword(e.target.value); setPassError(false)}}
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
