import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../Pages/Dashboard";
import { NotFound } from "../Pages/NotFound";
import UserRegistration from "../Pages/User/UserRegistration";

import AdminRegistration from "../Pages/Admin/AdminRegistration";
import  MilkInfo  from "../Componets/MilkInfo";
import UserDashboard from "../Pages/User/UserList/UserDashboard";
import AdminLoginCard from "../Pages/Admin/AdminLogin";

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        {/* Provide all routes here */}
        <Route path="/" element={<Dashboard />} />
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
