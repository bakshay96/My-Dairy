import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../Pages/Dashboard";
import { NotFound } from "../Pages/NotFound";
import UserRegistration from "../Pages/User/UserRegistration";

import AdminRegistration from "../Pages/Admin/AdminRegistration";
import  MilkInfo  from "../Componets/MilkInfo";
import UserDashboard from "../Pages/User/UserTable/UserDashboard";
import AdminLoginCard from "../Pages/Admin/AdminLogin";
import Home from "../Pages/Home/Home";

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        {/* Provide all routes here */}
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add/user" element={<UserRegistration />} />
        <Route path="/admin/signup" element={<AdminRegistration />} />
        <Route path="/admin/signin" element={<AdminLoginCard/>} />
        <Route path="/milk_info" element={<MilkInfo />} />
        <Route path="/user_dashboard" element={<UserDashboard/>} />

       
        <Route path="*" element={<NotFound />} />
      </Routes>
      
    </>
  );
};
