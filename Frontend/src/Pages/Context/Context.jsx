import { createContext, useEffect, useState } from "react";
import { useDisclosure } from "@chakra-ui/react";
export const AuthContext=createContext();



const ContextProvider=({children})=>{
  const { isOpen, onOpen, onClose } = useDisclosure();
    let [active,setActive]=useState(1);
    console.log(active)
    const  closeSomething =(onClose)=>{
   onClose()
    }
   
  return <AuthContext.Provider value={{active:"Hello"}}>
    {
        children
    }
  </AuthContext.Provider>
}
export default ContextProvider