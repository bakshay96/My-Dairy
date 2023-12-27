import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../Pages/Dashboard";
import { NotFound } from "../Pages/NotFound";
import UserRegistration from "../Pages/User/UserRegistration";

import AdminRegistration from "../Pages/Admin/AdminRegistration";
import  MilkInfo  from "../Componets/MilkInfo";

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        {/* Provide all routes here */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/user_register" element={<UserRegistration />} />
        <Route path="/admin_register" element={<AdminRegistration />} />
        <Route path="/milk_info" element={<MilkInfo />} />
       
        <Route path="*" element={<NotFound />} />
      </Routes>
      
    </>
  );
};
