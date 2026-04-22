//Write the ActionCreator functions here
import axios from "axios";
import * as types from "./actionTypes";
import { url2 } from "../Api/api";

export const signinRequestAction = () => {
  return { type: types.USER_SIGNIN_REQUEST };
};

export const signinSuccessAction = (payload) => {
  return { type: types.USER_SIGNIN_SUCCESS, payload };
};

export const signinFailureAction = () => {
  return { type: types.USER_SIGNIN_FAILURE };
};

// SignUp
export const signupRequestAction = () => {
  return { type: types.USER_SIGNUP_REQUEST };
};

export const signupSuccessAction = (payload) => {
  //console.log(payload);
  return { type: types.USER_SIGNUP_SUCCESS, payload };
};

export const signupFailureAction = (payload) => {
   console.log(payload);
  return { type: types.USER_SIGNUP_FAILURE ,payload};
};


// send message
export const sendMessageSuccessAction = (payload) => {
  console.log(payload);
  return { type: types.USER_MESSAGE_SUCCESS, payload };
};

export const sendMessageFailureAction = () => {
  // console.log(payload);
  return { type: types.USER_MESSAGE_FAILURE };
};


//loginout 
export const logoutRequestAction = () => {
  // console.log(payload);
  return { type: types.USER_LOGOUT_REQUEST, };
};
export const logoutSuccessAction = () => {
  // console.log(payload);
  return { type: types.USER_LOGOUT_SUCCESS, };
};

export const logoutFailureAction = (payload) => {
  // console.log(payload);
  return { type: types.USER_LOGOUT_FAILURE, payload};
};


// current user

export const getCurrentUserRequestAction =() =>{
  return {type: types.CURRENT_USER_REQUEST};
}

export const getCurrentUserSuccessAction =(payload) =>{
  return {type: types.CURRENT_USER_SUCCESS,payload};
}

export const getCurrentUserFailureAction =() =>{
  return {type: types.CURRENT_USER_FAILURE};
}

//=============Functions currying js ==========================================================================
 

// admin login function
export const signin = (payload) => async (dispatch) => {
  //console.log("action payload", payload);
  dispatch(signinRequestAction());
  return await axios
    .post(`${url2}/admin/login`, payload)
    
};

//admin register function
export const signup = (payload) => async (dispatch) => {
  dispatch(signupRequestAction());
  try {
    const res = await axios.post(`${url2}/admin/register`, payload);
    dispatch(signupSuccessAction(res.data));
    return res.data;
  } catch (error) {
    // Extract serializable error message
    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
    dispatch(signupFailureAction(errorMessage));
    throw error;
  }
};


// get current user

export const currentUser =(token) =>async(dispatch) =>{
  
  dispatch(getCurrentUserRequestAction())
  console.log("token current user",token)
  try {
     let res=await axios.get(`${url2}/admin/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log(res.data);
      dispatch(getCurrentUserSuccessAction(res.data))
  } catch (error) {
    dispatch(getCurrentUserFailureAction())
    console.log(error.response)
  }
}




// logout current user

export const logout =() =>async (dispatch) =>{
  dispatch(logoutRequestAction())
  try {
    setTimeout(()=>{
      localStorage.removeItem("token");
      dispatch(logoutSuccessAction())
    },1000)
    
  } catch (error) {
    const errorMessage = error.message || 'Logout failed';
    dispatch(logoutFailureAction(errorMessage))
  }
}

// send message
export const sendMail = (payload) => async (dispatch) => {
  dispatch(signinRequestAction());
  try {
    const res = await axios.post(`${url2}/admin/message`, payload);
    dispatch(sendMessageSuccessAction(res.data));
    return res.data;
  } catch (error) {
    // Extract serializable error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to send message';
    dispatch(sendMessageFailureAction(errorMessage));
    throw error;
  }
};





