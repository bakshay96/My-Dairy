import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../Pages/Dashboard";
import { NotFound } from "../Pages/NotFound";
import Footer from "../Componets/Footer";
import UserRegistration from "../Pages/User/UserRegistration";
import ContextProvider, { AuthContext } from "../Pages/Context/Context";
import AdminRegistration from "../Pages/Admin/AdminRegistration";

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        {/* Provide all routes here */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/user_register" element={<UserRegistration />} />
        <Route path="/admin_register" element={<AdminRegistration />} />
        <Route path="*" element={<Footer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      ;
    </>
  );
};
