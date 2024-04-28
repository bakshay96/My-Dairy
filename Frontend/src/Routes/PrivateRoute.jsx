import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

export const PrivateRoute = ({children}) => {
    let token = JSON.parse(localStorage.getItem("token")) || false;
    const Navigate=useNavigate();
 useEffect(()=>{
    if (! token) {
         Navigate("/admin/signin");
      }
 },[token])
 return(
    <>
    {
        children
    }
    </>
 )
  


}
