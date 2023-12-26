import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { MainRoutes } from './Routes/MainRoutes'
import Footer from './Componets/Footer'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <MainRoutes/>
    
    </>
  )
}

export default App
