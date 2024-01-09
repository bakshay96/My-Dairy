// App.js

import React, { useState } from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeatureContainer from './FeatureContainer';
import Footer from './Footer';
import { Element } from 'react-scroll';

function Home() {
    const [isLoggedIn, setLoggedIn] = useState(false);

    const handleLoginToggle = () => {
      setLoggedIn((prevLoggedIn) => !prevLoggedIn);
    };
  
    return (
      <div className="App">
        <Navbar isLoggedIn={isLoggedIn} onLoginToggle={handleLoginToggle} />
        <Element name="home">
          <HeroSection />
        </Element>
        <Element name="features">
          <FeatureContainer />
        </Element>
        <Element name="about">
          <Footer />
        </Element>
      </div>
    );
    
}

export default Home;
