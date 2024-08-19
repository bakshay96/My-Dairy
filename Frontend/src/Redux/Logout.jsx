
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { logoutSuccessAction } from './AuthReducer/action';
import { useNavigate } from 'react-router-dom';
import { Toast } from '@chakra-ui/react';
import { logout } from './Slices/authSlice';

export const Logout = () => {
    const {userData,loading,error } = useSelector((state) => state.farmer);
    const {token, user} = useSelector((state)=>state.auth);
    const dispatch=useDispatch();
    const navigate=useNavigate();
    let id;
    id && clearTimeout(id);
    if(!user)
    {
        

        dispatch(logout(token));
       id= setTimeout(()=>{
         return ( navigate("/"))

        },2000)
    }
  
  
}
