import React, { useEffect } from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stack,
} from "@chakra-ui/react";
import { useToast } from '@chakra-ui/react'

import { Logout } from "../Redux/Logout";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutSuccessAction } from "../Redux/AuthReducer/action";

export const ErrorHandler = ({ status, message }) => {
    const toast = useToast()
    const navigate=useNavigate();
    const dispatch=useDispatch();
    let id;
    if(status=="error" && message)
    {
     
        toast({
            position: 'top-right',
            title: `${message}`,
            description:"Session Expired..!",
            status: 'error',
            duration: 2000,
            isClosable: true,
          })

         id= setTimeout(()=>{
            //localStorage.setItem("token",null);
            toast({
              position: 'top-right',
              title: `Please Logout First`,
              status: 'warning',
              duration: 3000,
              isClosable: true,
            })
            dispatch(logoutSuccessAction());
            navigate("admin/signin");
          },3000)
          
          id && clearTimeout(id);

    }
  return (
    <>
    <div >
      <Stack >
        <Alert status={status}  alignItems='center'  justifyContent='center'
  textAlign='center'>
          <AlertIcon />
         {message?message:"There was an error processing your request"}
        </Alert>
      </Stack>
      <Logout />
    </div>
    
    </>
  );
};
