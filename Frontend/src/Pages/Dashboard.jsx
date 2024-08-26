import React, { useContext, useEffect, useState } from "react";
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
  ModalCloseButton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalOverlay,
  Heading,
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
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { FaAddressBook, FaBluetooth, FaRegAddressCard } from "react-icons/fa";
// import UserRegistration from "./User/UserRegistration";
import { NotFound } from "./NotFound";
// import AdminRegistration from "./Admin/AdminRegistration";
// import MilkInfo from "../Components/MilkInfo";
// import UserDashboard from "./User/UserTable/UserDashboard";
// import AddMilk from "./Milk/AddMilk";
// import MilkDashboard from "./Milk/MilkTable/MilkDashboard";
import MyContext from "./ContextApi/MyContext";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import brandLogo from "../assets/Logo/project-logo.svg";

import { Spinner } from "@nextui-org/react";
import { Loader } from "../Components/Loader";
import { ErrorHandler } from "../Components/ErrorHandler";
import { getFarmersDetails } from "../Redux/Slices/farmerSlice";
import { existingUser, logout } from "../Redux/Slices/authSlice";

const LinkItems = [
  { id: "1", name: "Add Milk", icon: FiHome, path: "/dashboard/add_milk" },
  {
    id: "2",
    name: "Customers",
    icon: FaRegAddressCard,
    path: "/dashboard/user_dashboard",
  },
  {
    id: "3",
    name: "Milk Stats",
    icon: FiTrendingUp,
    path: "/dashboard/milk_info",
  },
  { id: "4", name: "Favourites", icon: FiStar, path: "#" },
  { id: "5", name: "Settings", icon: FiSettings, path: "/dashboard/rate" },
];

export default function Dashboard({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { token, user} = useSelector((state) => state.auth);
  const { userData,loading,error} = useSelector((state) => state.farmer);
  //console.log("farmer state", loading, error, userData);
  const { globalState, setGlobalState } = useContext(MyContext);
  const { active } = globalState;
  const dispatch = useDispatch();
  const naviate = useNavigate();
  const location = useLocation();
  //console.log("curent path", location.pathname);
  // console.log("contact",globalState,active)
  // if(!user)
  // {
  //   console.log("not user data there")
  //   naviate("/")
  // }
  useEffect(() => {
    if (user) {
      dispatch(getFarmersDetails(token));
    }
    console.log("dash app render");
  }, [user]);
  return (
    <>
      {loading && <Loader />}
      <Box
        minH="100vh"
        bg={useColorModeValue("gray.100", "gray.900")}
        border={"1px solid red"}
      >
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
        <Box ml={{ base: 0, md: 60 }} p="4">
          {/* main container */}
          {children}

          {/* {active == 1 ? (
            <AddMilk />
          ) : active == 2 ? (
            <UserDashboard />
          ) : active == 3 ? (
            <MilkDashboard />
          ) : active == 4 ? (
            <NotFound />
          ) : (
            <NotFound />
          )} */}
          {error ? (
            <ErrorHandler status={"error"} message={error} />
          ) : (
            ""
          )}
           {/* cover banner  */}
          {location.pathname ==="/dashboard" && (
            <div id='home' className="mx-auto w-full max-w-7xl">
            <aside className="relative overflow-hidden text-black rounded-lg sm:mx-16 mx-2 sm:py-16">
                <div className="relative z-10 max-w-screen-xl px-4  pb-20 pt-10 sm:py-24 mx-auto sm:px-6 lg:px-8">
                    <div className="max-w-xl sm:mt-1 mt-80 space-y-8 text-center sm:text-right sm:ml-auto">
                        <h2 className="text-xl font-bold sm:text-4xl ">
                            Get Started Now
                            <span className="hidden sm:block text-sm font-mono">Effortless Milk Management with Milkify</span>
                        </h2>

                        <NavLink
                            className="inline-flex text-white items-center px-6 py-3 font-medium bg-orange-700 rounded-lg hover:opacity-75"
                            to="/dashboard/user_dashboard"
                        >
                            <svg
                                fill="white"
                                width="24"
                                height="24"
                                xmlns="http://www.w3.org/2000/svg"
                                fillRule="evenodd"
                                clipRule="evenodd"
                            >
                                <path d="M1.571 23.664l10.531-10.501 3.712 3.701-12.519 6.941c-.476.264-1.059.26-1.532-.011l-.192-.13zm9.469-11.56l-10.04 10.011v-20.022l10.04 10.011zm6.274-4.137l4.905 2.719c.482.268.781.77.781 1.314s-.299 1.046-.781 1.314l-5.039 2.793-4.015-4.003 4.149-4.137zm-15.854-7.534c.09-.087.191-.163.303-.227.473-.271 1.056-.275 1.532-.011l12.653 7.015-3.846 3.835-10.642-10.612z" />
                            </svg>
                            &nbsp; Start now
                        </NavLink>
                    </div>
                </div>

                <div className="absolute inset-0 w-full sm:my-20 sm:pt-1 pt-12 h-full  ">
                    <img className="w-100" src="https://media.istockphoto.com/id/1297005860/photo/raw-milk-being-poured-into-container.jpg?s=612x612&w=0&k=20&c=5Xumh49_zYs9GjLkGpZXM41tS17K8M-svN9jLMv0JpE=" alt="image1" style={{"borderRadius":"2.5rem"}} />
                </div>
            </aside>

            {/* <div className="grid  place-items-center sm:mt-20">
                <img className="sm:w-96 w-48" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxS5oH4uzsiWFjIjGBcZUBkXC8RyrFpUP4Tw&usqp=CAU" alt="image2" />
            </div>

            <h2 className="text-center text-2xl sm:text-2xl py-10 font-medium">Milk Management, Simplified by Milkify.</h2> */}
        </div>
          )}
          <Outlet />
        </Box>
      </Box>
    </>
  );
}

const SidebarContent = ({ onClose, ...rest }) => {
  //const {globalState, setGlobalState} = useContext(MyContext);

  //console.log("contet",globalState)
  const navigate = useNavigate();
  const location=useLocation();

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
            <Link to="/" fontSize={"1rem"}>
              <Image
                onClick={() => navigate("/")}
                w="4rem"
                borderRadius={"2rem"}
                alt="logo"
                src={brandLogo}
              />
            </Link>
          </Text>
          <CloseButton
            display={{ base: "flex", md: "none" }}
            onClick={onClose}
          />
        </Flex>
        {LinkItems.map((link) => (
          <NavItem
          bg={location.pathname==link.path?"cyan.500":""}
          color={location.pathname==link.path?"white.400":"teal"}
          onClick={onClose}
            key={link.name}
            icon={link.icon}
            id={link.id}
            onClose={onClose}
            path={link.path}
          >
            {link.name}
          </NavItem>
        ))}
      </Box>
    </>
  );
};

const NavItem = ({ icon, onClose, id, path, children, ...rest }) => {
  const { globalState, setGlobalState } = useContext(MyContext);
  const [isClicked, setIsClicked] = useState(false);
  const location=useLocation();
  const handleButtonClick = () => {
    setIsClicked(!isClicked);
  };
  function CloseSidebar() {
    //setActive(id)
    // closeSomething(onClose)
  }
  return (
    <NavLink
      to={`${path}`}
      style={{ textDecoration: "none" }}
      _focus={{ boxShadow:"none" }}
      
    >
      <Flex
        onClick={() => {
          setGlobalState((globalState) => ({ ...globalState, active: id })),
            onClose,
            handleButtonClick;
        }}
        align="center"
        onKeyDown={{ bg: "cyan.400", color: "white" }}
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
    </NavLink>
  );
};

const MobileNav = ({ onOpen, onClose, ...rest }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const { token,user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleAuth = () => {
    dispatch(logout(token));

   
  };
  useEffect(() => {
    if (!user) {
      navigate("/admin/signin");
    }
  }, [token,user]);
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
        <Link to="/">
          <Image
            w="3rem"
            borderRadius={"1.5rem"}
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJU0J5A2bvyrbWwUo2-Gy0NlB2Vpv7mUXmAkbuk4t-d0RnEvbH72osa0p1wsTZlnm86io&usqp=CAU"
          />
        </Link>
      </Text>

      <HStack spacing={{ base: "0", md: "6" }}>
        <IconButton
          size="lg"
          variant="ghost"
          aria-label="open menu"
          icon={<FiBell />}
        />
        <Button onClick={toggleColorMode}>
          {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
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
                  <Text fontSize="sm">{user && user.name || "AB"}</Text>
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
              {/* <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem>Billing</MenuItem> */}
              <MenuDivider />
              <MenuItem onClick={() => handleAuth()}>
                {user? "Sign out":""}
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};
