import {useContext} from "react";
import { useSelector } from "react-redux";
import {Navigate} from "react-router-dom";

function PrivateRoute({children}) {
    const { token, isLoading, isError, isAuth } = useSelector(
        (store) => store.authReducer
      );
    if(token=="" || isAuth=="false")
    {
        return <Navigate to="/admin/signin" />
    }
    return children;
}

export default PrivateRoute;
