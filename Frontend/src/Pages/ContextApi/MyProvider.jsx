import { useState } from "react"
import MyContext from "./MyContext";


const initialState = {
  active:1,
  isAuth:false
}

const MyProvider = ({children})=>{

  const [globalState, setGlobalState] = useState(initialState);

  return (
    <MyContext.Provider value = {{globalState, setGlobalState}}>
      {children}
    </MyContext.Provider>

  )
}


export default MyProvider;