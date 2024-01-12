import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../Pages/Dashboard";
import { NotFound } from "../Pages/NotFound";
import UserRegistration from "../Pages/User/UserRegistration";

import AdminRegistration from "../Pages/Admin/AdminRegistration";
import MilkInfo from "../Components/MilkInfo";
import UserDashboard from "../Pages/User/UserTable/UserDashboard";
import AdminLoginCard from "../Pages/Admin/AdminLogin";

import { Layout } from "../Pages/Layout/Layout";
import About from "../Components/About/About";
import Github from "../Components/Github/Github";
import Contact from "../Components/Contact/Contact";
import Home from "../Components/Home/Home";
import User from "../Components/User/User";

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        {/* Provide all routes here */}
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="user/:userid" element={<User />} />
          <Route  path="/github" element={<Github />} />
        </Route>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add/user" element={<UserRegistration />} />
        <Route path="/admin/signup" element={<AdminRegistration />} />
        <Route path="/admin/signin" element={<AdminLoginCard />} />
        <Route path="/milk_info" element={<MilkInfo />} />
        <Route path="/user_dashboard" element={<UserDashboard />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};
