// Footer.js

import React from 'react';

const Footer = () => {
  const handleScrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-gray-800 text-white py-4 text-center">
        
      <button onClick={handleScrollToTop} className="text-white">
        Scroll to Top
      </button>
    </footer>
  );
};

export default Footer;
