
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { logoutSuccessAction } from './AuthReducer/action';
import { useNavigate } from 'react-router-dom';
import { Toast } from '@chakra-ui/react';

export const Logout = () => {
    const { isLoading, userData,isError,errorMessage } = useSelector((store) => store.farmerReducer);
    const dispatch=useDispatch();
    const navigate=useNavigate();
    let id;
    id && clearTimeout(id);
    if(isError && errorMessage)
    {
        

        dispatch(logoutSuccessAction());
       id= setTimeout(()=>{
         return ( navigate("/admin/signin"))

        },2000)
    }
  
  
}
