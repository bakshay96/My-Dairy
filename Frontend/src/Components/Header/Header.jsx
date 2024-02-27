import React, { useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { Link, NavLink,useNavigate } from "react-router-dom";
import brandLogo from "../../assets/Logo/project-logo.svg";
import { useDispatch, useSelector } from "react-redux";
import { logoutSuccessAction } from "../../Redux/AuthReducer/action";

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [backdrop, setBackdrop] = React.useState("opaque");
  const { token, isLoading, isError,  isAuthenticated } = useSelector(
    (store) => store.authReducer
  );
  //console.log("auth header", token, isAuthenticated);
  const dispatch = useDispatch();
  const navigate=useNavigate();

  // handle authication function
  const handleAuth = () => {
   
   // console.log("auth",token,isAuthenticated)
    if(token!==null)
    {
      //console.log("handle auth sdfsf")

      localStorage.setItem("token", null);
      dispatch(logoutSuccessAction());
      navigate("/admin/signin")
    }

     
    
    
  };

  const handleOpen = (backdrop) => {
    setBackdrop(backdrop);
    onOpen();
  };
  
  useEffect(()=>{

  },[])
 
  return (
    <header className="shadow sticky z-50 top-0" id="header">
      <nav className="bg-white border-gray-200 px-4 lg:px-6 py-2.5">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          <Link to="/" className="flex items-center">
            <img src={brandLogo} className="mr-3 h-14" alt="Logo" />
          </Link>
          <div className="flex items-center lg:order-2">
            <Link
            
              to={token ==null?"/admin/signin":"/"}
              onClick={() => handleAuth()}
              className="text-gray-800 hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 focus:outline-none"
            >
              {token == null ? "Login" : "Logout"}
            </Link>
            <Link
              to={token==null ? "/admin/signup":"dashboard"}
              onPress={() => handleOpen(b)}
              className="text-white bg-orange-700 hover:bg-orange-800 focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 focus:outline-none"
            >
             {token==null? "Get started":"Dashboard"}
            </Link>
          </div>
          <div
            className="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1"
            id="mobile-menu-2"
          >
            <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `block py-2 pr-4 pl-3 duration-200 ${
                      isActive ? "text-orange-700" : "text-gray-700"
                    } border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0`
                  }
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `block py-2 pr-4 pl-3 duration-200 ${
                      isActive ? "text-orange-700" : "text-gray-700"
                    } border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0`
                  }
                >
                  About
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `block py-2 pr-4 pl-3 duration-200 ${
                      isActive ? "text-orange-700" : "text-gray-700"
                    } border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0`
                  }
                >
                  Contact
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="https://github.com/bakshay96"
                  className={({ isActive }) =>
                    `block py-2 pr-4 pl-3 duration-200 ${
                      isActive ? "text-orange-700" : "text-gray-700"
                    } border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0`
                  }
                >
                  Github
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
