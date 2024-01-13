import React, {  useContext, useEffect,  } from "react";
import {
  IconButton,
  Avatar,
  Box,
  CloseButton,
  Flex,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
  Link,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Image,
  useColorMode,
  Button,
  Spacer,
  border,
  useStatStyles,
} from "@chakra-ui/react";
import {
  FiHome,
  FiTrendingUp,
  FiCompass,
  FiStar,
  FiSettings,
  FiMenu,
  FiBell,
  FiChevronDown,
} from "react-icons/fi";
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { FaAddressBook,FaRegAddressCard } from "react-icons/fa";
import UserRegistration from "./User/UserRegistration";
import { NotFound } from "./NotFound";
import MyContext from "./ContextApi/MyContext";
import AdminRegistration from "./Admin/AdminRegistration";
import MilkInfo  from "../Components/MilkInfo";
import UserDashboard from "./User/UserTable/UserDashboard";
import AddMilk from "./Milk/AddMilk";
import MilkDashboard from "./Milk/MilkTable/MilkDashboard";
import { useDispatch, useSelector } from "react-redux";
import { getFarmersDetails } from "../Redux/userReducer/action";
import { useNavigate } from "react-router-dom";
import { logoutSuccessAction } from "../Redux/AuthReducer/action";




const LinkItems = [
  {id:"1", name: 'Add Milk', icon: FiHome },
  {id:"2", name: 'Customers', icon: FaRegAddressCard },
  {id:"3", name: 'Milk Stats', icon: FiTrendingUp },
  {id:"4", name: 'Favourites', icon: FiStar },
  {id:"5", name: 'Settings', icon: FiSettings },
];

export default function Dashboard({ children }) {
 
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {token,isAuth}=useSelector((store)=>store.authReducer);
  
  const {globalState, setGlobalState} = useContext(MyContext);
  const {active}=globalState;
  const dispatch=useDispatch();
  const naviate=useNavigate();
// console.log("contact",globalState,active)
useEffect(()=>{
 
    dispatch(getFarmersDetails({token}))
  
},[])
  return (
    <>
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")} border={"5px solid red"}>
      <SidebarContent 
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
      
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav onOpen={onOpen} onClose={onClose} />
      <Box ml={{ base: 0, md: 60 }} p="4" >
        {/* main container */}
        {children}
       
      {
        active==1?<AddMilk />:active==2?<UserDashboard />:active==3?<MilkDashboard/>:active==4?<MilkInfo/>:<NotFound/>
      }
      </Box>
      
    </Box>
   
    </>
     
    
    
  );
}


const SidebarContent = ({ onClose, ...rest }) => {
  //const {globalState, setGlobalState} = useContext(MyContext);
    
  //console.log("contet",globalState)
  const navigate=useNavigate();
 
  return (
    <>
    <Box
      transition="3s ease"
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
          <Link to="/" fontSize={"1rem"}><Image onClick={()=>navigate("/")} w="4rem" borderRadius={"2rem"} alt="logo" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJU0J5A2bvyrbWwUo2-Gy0NlB2Vpv7mUXmAkbuk4t-d0RnEvbH72osa0p1wsTZlnm86io&usqp=CAU" /></Link>
        </Text>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem key={link.name} icon={link.icon} id={link.id}  onClose={onClose} >
          {link.name}
        </NavItem>
      ))}
    </Box>
    
    </>
  );
};


const NavItem = ({ icon, onClose,id, children, ...rest }) => {
const {globalState, setGlobalState} = useContext(MyContext);
  function CloseSidebar(){
   
    //setActive(id) 
  
 // closeSomething(onClose)
   
  }
  return (
    <Link
      href="#"
      style={{ textDecoration: "none" }}
      _focus={{ boxShadow: "none" }}
      >
      <Flex
        onClick={()=> {setGlobalState((globalState)=>({...globalState, active:id})),onClose}}
       
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: "cyan.400",
          color: "white",
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: "white",
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};


const MobileNav = ({ onOpen, onClose, ...rest }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  
  const {token}=useSelector((store)=>store.authReducer)
  const dispatch=useDispatch();
  const handleAuth =()=>{
    localStorage.setItem("token","");
    dispatch(logoutSuccessAction());
  
    console.log("dash auth",token)

  }
  useEffect(()=>{

  },[token])
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: "flex", md: "none" }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
      >
       <Link to="/"><Image w="3rem" borderRadius={"1.5rem"}  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJU0J5A2bvyrbWwUo2-Gy0NlB2Vpv7mUXmAkbuk4t-d0RnEvbH72osa0p1wsTZlnm86io&usqp=CAU" /></Link>
      </Text>

      <HStack spacing={{ base: "0", md: "6" }}>
        <IconButton
          size="lg"
          variant="ghost"
          aria-label="open menu"
          icon={<FiBell />}
        />
      <Button onClick={toggleColorMode}>
                {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              </Button>
          
        <Flex alignItems={"center"}>
          <Menu>
          
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{ boxShadow: "none" }}
            >
              <HStack>
                <Avatar
                  size={"sm"}
                  src={
                    "https://web.archive.org/web/20230521174951/https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9"
                  }
                />
                <VStack
                  display={{ base: "none", md: "flex" }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                >
                  <Text fontSize="sm">AB</Text>
                  <Text fontSize="xs" color="gray.600">
                    Admin
                  </Text>
                </VStack>
                <Box display={{ base: "none", md: "flex" }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue("white", "gray.900")}
              borderColor={useColorModeValue("gray.200", "gray.700")}
            >
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem>Billing</MenuItem>
              <MenuDivider />
              <MenuItem onClick={()=>handleAuth()}>{token!=="" && "Sign out"}</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};
