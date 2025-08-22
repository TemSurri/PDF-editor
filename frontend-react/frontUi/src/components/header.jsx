import React from 'react'
import "./stylesheets/header.css"

const Header = () => {
    return (
        <header className = 'header'>
        <h1 className = 'title'>Simple PDF Editor</h1>
        <nav className="nav">
        <a href="/login">Login</a>
        <a href="/register">Sign Up</a>
      </nav>
        </header>
    )
}

export default Header