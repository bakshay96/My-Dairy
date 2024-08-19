import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export const PrivateRoute = ({children}) => {
   const {user,token} =useSelector((state)=>state.auth)
    const Navigate=useNavigate();
 useEffect(()=>{
    if (!user) {
         Navigate("/admin/signin");
      }
 },[token,user])
 return(
    <>
    {
        children
    }
    </>
 )
  


}
