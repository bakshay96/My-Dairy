import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { MainRoutes } from './Routes/MainRoutes'
import Footer from './Componets/Footer'
import MilkInfo from './Componets/MilkInfo'
import Model from './Pages/User/UserList/model'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <MainRoutes/>
     {/* <Model/> */}
     
    
    </>
  )
}

export default App
