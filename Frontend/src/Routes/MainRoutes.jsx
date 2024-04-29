import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

const Dashboard = lazy(() => import("../Pages/Dashboard"));
import { NotFound } from "../Pages/NotFound";
const UserRegistration = lazy(() => import("../Pages/User/UserRegistration"));
const AdminRegistration = lazy(() =>import("../Pages/Admin/AdminRegistration"));
const MilkInfo = lazy(() => import("../Components/MilkInfo"));
const UserDashboard = lazy(() =>import("../Pages/User/UserTable/UserDashboard"));
const AdminLoginCard = lazy(() => import("../Pages/Admin/AdminLogin"));
const Layout = lazy(() => import("../Pages/Layout/Layout"));
const About = lazy(() => import("../Components/About/About"));
const Contact = lazy(() => import("../Components/Contact/Contact"));
const Home = lazy(() => import("../Components/Home/Home"));
const User = lazy(() => import("../Components/User/User"));
import Test from "../Test";
import { Loader1 } from "../Components/Loader1";
import { PrivateRoute } from "./PrivateRoute";
//import MilkDashboard from "../Pages/Milk/MilkTable/MilkDashboard";
const AddMilk = lazy(() => import("../Pages/Milk/AddMilk"));
const MilkDashboard = lazy(() =>
  import("../Pages/Milk/MilkTable/MilkDashboard")
);

export const MainRoutes = () => {
  return (
    <>
      <Routes>
        {/* Provide all routes here */}
        {/* // layout nested routing */}
        <Route
          path="/"
          element={
            <Suspense fallback={<Loader1 />}>
              <Layout />
            </Suspense>
          }
        >
          <Route
            path=""
            element={
              <Suspense fallback={<Loader1 />}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<Loader1 />}>
                <About />
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<Loader1 />}>
                <Contact />
              </Suspense>
            }
          />
          <Route
            path="user/:userid"
            element={
              <Suspense fallback={<Loader1 />}>
                <User />
              </Suspense>
            }
          />
          <Route
            path="/admin/signup"
            element={
              <Suspense fallback={<Loader1 />}>
                <AdminRegistration />
              </Suspense>
            }
          />
          <Route
            path="/admin/signin"
            element={
              <Suspense fallback={<Loader1 />}>
                <AdminLoginCard />
              </Suspense>
            }
          />
        </Route>
        <Route path="test" element={<Test />} />

        //dashboard nested routes
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<Loader1 />}>
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            </Suspense>
          }
        >
          <Route
            path="add_milk"
            element={
              <Suspense fallback={<Loader1 />}>
                <PrivateRoute>
                  <AddMilk />
                </PrivateRoute>
              </Suspense>
            }
          />

          <Route
            path="add_user"
            element={
              <Suspense fallback={<Loader1 />}>
                <PrivateRoute>
                  <UserRegistration />
                </PrivateRoute>
              </Suspense>
            }
          />

          <Route
            path="milk_info"
            element={
              <Suspense fallback={<Loader1 />}>
                <PrivateRoute>
                  <MilkDashboard />
                </PrivateRoute>
              </Suspense>
            }
          />

          <Route
            path="user_dashboard"
            element={
              <Suspense fallback={<Loader1 />}>
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              </Suspense>
            }
          />
        </Route>
        <Route
          path="*"
          element={
            <Suspense fallback={<Loader1 />}>
              <Layout />
              <Home />
            </Suspense>
          }
        />
        <Route path="/test" element={<Loader1 />} />
      </Routes>
    </>
  );
};
