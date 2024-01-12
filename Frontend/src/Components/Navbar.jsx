// Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-scroll';

const Navbar = ({ isLoggedIn, onLoginToggle }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen((prevOpen) => !prevOpen);
  };

  return (
    <nav className="bg-gray-800 p-4 fixed top-0 w-full z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src="https://meridairy.in/logo.png" alt="Logo" className="h-10 mr-4" />
          <span className="text-white">Milkify</span>
        </div>
        <div className="hidden md:flex space-x-4">
          <Link to="home" smooth={true} duration={500} offset={-70} className="text-white">
            Home
          </Link>
          <Link to="features" smooth={true} duration={500} offset={-70} className="text-white">
            Features
          </Link>
          <Link to="about" smooth={true} duration={500} offset={-70} className="text-white">
            About
          </Link>
          {isLoggedIn ? (
            <Link>
            <button className="text-white" onClick={onLoginToggle}>
              Logout
            </button>
            </Link>
          ) : (
            <Link to='/admin/signin'>
            <button className="text-white" onClick={onLoginToggle}>
              Login
            </button>
            </Link>
          )}
        </div>
        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden">
          <button
            onClick={handleMobileMenuToggle}
            className="text-white focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              ></path>
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-700 p-4">
          <Link to="home" smooth={true} duration={500} offset={-70} className="text-white block mb-2">
            Home
          </Link>
          <Link
            to="features"
            smooth={true}
            duration={500}
            offset={-70}
            className="text-white block mb-2"
          >
            Features
          </Link>
          <Link to="about" smooth={true} duration={500} offset={-70} className="text-white block mb-2">
            About
          </Link>
          {isLoggedIn ? (
            <button className="text-white block" onClick={onLoginToggle}>
              Logout
            </button>
          ) : (
            <button className="text-white block" onClick={onLoginToggle}>
              Login
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
