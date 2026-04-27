import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader1 } from '../Components/Loader1';

export const PrivateRoute = ({children}) => {
   const {user, token, loading} = useSelector((state) => state.auth);
   const navigate = useNavigate();
   const location = useLocation();

   useEffect(() => {
      // Only redirect if we're not loading and there's no user/token
      if (!loading && !user && !token) {
         navigate("/admin/signin", { 
            replace: true,
            state: { from: location.pathname }
         });
      }
   }, [loading, user, token, navigate, location.pathname]);

   // Show loading spinner while checking authentication
   if (loading) {
      return <Loader1 />;
   }

   // If no user/token, don't render children (will redirect via useEffect)
   if (!user && !token) {
      return <Loader1 />;
   }

   // User is authenticated, render children
   return children;
}
