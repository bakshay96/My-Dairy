import React, { useEffect, useState } from "react";
import {
    Button,
    Checkbox,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    Image,
    Text,
    InputGroup,
    InputRightElement,
  } from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react'
import UpperNavbar from '../../Components/UpperNavbar';
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate,Link} from "react-router-dom";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { signin, signinFailureAction, signinSuccessAction, signupFailureAction } from "../../Redux/AuthReducer/action";
import logo from "../../assets/Logo/project-logo.svg"
  export default function AdminLoginCard() {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassord] = useState("");
    const [mobile,setMobile]=useState("");
    const dispatch=useDispatch();
    const navigate=useNavigate();
    const location=useLocation();
    const toast = useToast()

    const {token,isLoading,isError,isAuth}=useSelector((store)=>store.authReducer);
    //console.log("auth reducer","token","isLoading","isError","isAuth")
    console.log("auth reducer",token,isLoading,isError,isAuth)

    const loginHandler =(e)=>{
      e.preventDefault();

      if(!(password && mobile))
      {
        toast({
          title: '404 Fields Alert',
          description: "Please fill all the fields.",
          status: 'error',
          duration: 4000,
          isClosable: true,
        })
        setPassord("");
        setMobile("");
      }
      else
      {
        
        let loginData={mobile,password};
        //console.log("login data",loginData);
        dispatch(signin(loginData))
        .then((res)=>{
          console.log("res",res)
          dispatch(signinSuccessAction(res.data.token))
          toast({
            title: `${res.status},${res.statusText}`,
            description: `${res.data.msg}`,
            position:"top",
            status: 'success',
            duration: 4000,
            isClosable: true,
          })
        }).catch((error)=>
        {
          console.log("error",error)
           dispatch(signinFailureAction())
          toast({
            title: `${error.response.status},${error.response.statusText} !`,
            description:  `${error.response.data.error}`,
            status: 'error',
            duration: 5000,
            position:"top",
            isClosable: true,
          })
        })
        
        
      }
    }
    useEffect(()=>{
      if(!token)
      {
        navigate("/admin/signin")
      }
      else
      {
        navigate("/dashboard")
      }
    },[token])
    return (
        <>
        <UpperNavbar/>
      <Stack minH={'100vh'} direction={{ base: 'column', md: 'row' }}>
        <Flex p={8} flex={1} align={'center'} justify={'center'}>
          <form onSubmit={loginHandler}>
          <Stack spacing={4} w={'full'} maxW={'md'}>
            <Heading fontSize={'2xl'}>Sign in to your account</Heading>
            <FormControl id="phone">
              <FormLabel>Phone number</FormLabel>
              <Input type="tel" name="mobile" value={mobile} onChange={((e)=>setMobile(e.target.value))} placeholder="User mobile number" />
            </FormControl>
            <FormControl id="password" isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="User password"
                      value={password}
                      onChange={((e)=>setPassord(e.target.value))}
                    />
                    <InputRightElement h={"full"}>
                      <Button
                        variant={"ghost"}
                        onClick={() =>
                          setShowPassword((showPassword) => !showPassword)
                        }
                      >
                        {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

            <Stack spacing={6}>
              <Stack
                direction={{ base: 'column', sm: 'row' }}
                align={'start'}
                justify={'space-between'}>
                <Checkbox>Remember me</Checkbox>
                <Link color={'blue.500'}>Forgot password?</Link>
              </Stack>
              <Button colorScheme={'blue'} variant={'solid'} type="submit">
                Sign in
              </Button>
            </Stack>
            <Stack pt={6}>
              <Text align={'center'}>
                Don't have a account? <Link to={"/admin/signup"}> <span  style={{"color":"blue",}}>Sign up</span></Link>
              </Text>
            </Stack>
          </Stack>

          </form>
        </Flex>
        <Flex flex={1} justifyContent={"space-around"} >
          <Image
            alt={'Login Image'}
           
            objectFit={
              "initial"
            }
          
           
           
            borderRadius={"1rem"}
           
            src={
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiHOmgxtkBlcny1wDyolFO895EBNWGnKUY_w&usqp=CAU'
            }
           
          />
        </Flex>
      </Stack>
        </>
    );
  }