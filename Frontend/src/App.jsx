import { useEffect, useState } from 'react'

import './App.css'
import { MainRoutes } from './Routes/MainRoutes'
import Test from './Test'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';



function App() {
  const [count, setCount] = useState(0)
  const {user,token} =useSelector((state)=>state.auth)
  //console.log(user,token)
  useEffect(()=>{
    console.log("app render")
  },[])

  return (
    <>
     <MainRoutes/>
     <ToastContainer
     autoClose={4000}
     hideProgressBar={false}
     newestOnTop
     closeOnClick
     rtl={false}
     pauseOnFocusLoss
     draggable
     pauseOnHover
     theme="light"
     transition: Bounce
      />
     {/* <Test /> */}
     
     
    
    </>
  )
}

export default App
