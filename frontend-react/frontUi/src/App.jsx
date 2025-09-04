import { useContext } from 'react'
import Header from './components/header.jsx'
import Footer from './components/footer.jsx'
import Home from './components/home.jsx'
import NotFound from './components/notFound.jsx'
import Register from './components/register.jsx'
import Login from './components/login.jsx'
import {Navigate, BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css'
import { AuthContext } from './context/AuthContext.jsx'


function App() {
  const {isLoggedIn} = useContext(AuthContext)

  return (
    <BrowserRouter>
      
        <div className="app">
          <Header />
          <main className="main">
          <Routes>
            <Route path = "/" element = {<Home />}/>
            <Route path="/register" 
            element={isLoggedIn ? <Navigate to="/" replace /> : <Register />} />
            <Route path = '/login'
            element ={isLoggedIn ? <Navigate to="/" replace /> : <Login />} />
          
            <Route path="*" element={<Home />} />
          </Routes>
          </main>
          <Footer />
        </div>
      
    </BrowserRouter>    
  )
}

export default App
