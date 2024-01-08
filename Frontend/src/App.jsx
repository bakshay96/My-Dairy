import { useState } from 'react'

import './App.css'
import { MainRoutes } from './Routes/MainRoutes'
import Test from './Test'



function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <MainRoutes/>
     {/* <Test /> */}
     
     
    
    </>
  )
}

export default App
