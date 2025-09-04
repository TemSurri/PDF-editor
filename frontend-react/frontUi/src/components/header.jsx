import React, {useContext} from 'react'
import "./stylesheets/header.css"
import { AuthContext } from '../context/AuthContext'

const Header = () => {
    const {isLoggedIn, logout} = useContext(AuthContext);
    
    return (
        <header className = 'header'>
        <a href = '/' style={{ textDecoration: "none"}}>
        <h1 className = 'title'>Simple PDF Editor</h1>
        </a>
        <nav className="nav">
        {isLoggedIn ? (
       <>
        <button onClick={logout}>Logout</button>
       </>) : (
       <>
        <a href="/login">Login</a>
        <a href="/register">Sign Up</a>
       </>)}
        
        </nav>
        </header>
    )
}

export default Header