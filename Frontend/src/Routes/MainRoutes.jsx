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

import Contact from "../Components/Contact/Contact";
import Home from "../Components/Home/Home";
import User from "../Components/User/User";
import PrivateRoute from "./PrivateRoute";

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        {/* Provide all routes here */}
        <Route path="/" element={<Layout />}>
          <Route path="" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="user/:userid" element={<User />} />
          <Route path="/admin/signup" element={<AdminRegistration />} />
          <Route path="/admin/signin" element={<AdminLoginCard />} />
        </Route>

        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />

          </PrivateRoute>
        }>
          
          <Route path="dashboard/add/user" element={<UserRegistration />} />
          <Route path="dashboard/milk_info" element={<MilkInfo />} />
          <Route path="dashboard/user_dashboard" element={<UserDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};
