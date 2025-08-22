import { useState } from 'react'
import Header from './components/header.jsx'
import Footer from './components/footer.jsx'
import Home from './components/home.jsx'
import './App.css'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className="app">
      <Header />
      <main className="main">
        <Home/>
      </main>
      <Footer />
    </div>
    </>    
  )
}

export default App
