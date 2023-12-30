//Write the ActionCreator functions here
import axios from "axios";
import * as types from "./actionTypes";


const signinRequestAction = () => {
    return { type: types.USER_SIGNIN_REQUEST };
  };
  
  const signinSuccessAction = (payload) => {
    return { type: types.USER_SIGNIN_SUCCESS, payload };
  };
  
  const signinFailureAction = () => {
    return { type: types.USER_SIGNIN_FAILURE };
  };


  // SignUp
  const signupRequestAction=()=>{
    return {type:types.USER_SIGNUP_REQUEST}
  }

  const signupSuccessAction = (payload) => {
    console.log(payload);
    return { type: types.USER_SIGNUP_SUCCESS, payload };
  };

  const signupFailureAction = () => {
    console.log(payload);
    return { type: types.USER_SIGNUP_FAILURE};
  };

  
  
//=============Functions currying js ==========================================================================
const url="https://milkify.cyclic.app/api";

export const signin = (payload)=>async (dispatch)=>{

    dispatch(signinRequestAction());

    try {
        return await axios
            .post(`${url}/admin/login`, payload);
        
        dispatch({ type: types.LOGIN_SUCCESS, payload: r.data.token });
    } catch (e) {
        dispatch({ type: types.LOGIN_FAILURE });
    }
};


export const signup =(payload)=>async(dispatch)=>{
    dispatch(signupRequestAction());
    try {
        return await axios
            .post(`${url}/admin/register`, payload)
            .then((res)=>{
                console.log("action",res);
                dispatch(signupSuccessAction(true));
            })
            .catch((res)=>{
                dispatch(signupFailureAction())
            })
            
    } catch (error) {
        dispatch(signupFailureAction())
    }
}


