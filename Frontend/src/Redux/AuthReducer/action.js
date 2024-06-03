//Write the ActionCreator functions here
import axios from "axios";
import * as types from "./actionTypes";
import { url, url2,localhost } from "../Api/api";

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


//SignOut
export const logoutSuccessAction = () => {
  // console.log(payload);
  return { type: types.USER_LOGOUT_SUCCESS, };
};

//RESET_REQUEST

export const resetRequestAction =(payload) =>{
  return {type: types.RESET_REQUEST,payload};
}

//=============Functions currying js ==========================================================================
 

// admin signin function
export const signin = (payload) => async (dispatch) => {
 // console.log("action payload", payload);
  dispatch(signinRequestAction());
  return await axios
    .post(`${url2}/admin/login`, payload)
    
};

//admin signup function
export const signup = (payload) => async (dispatch) => {
 // console.log("action", payload);
  dispatch(signupRequestAction());
  try {
    return await axios
      .post(`${url2}/admin/register`, payload)
      .then((res) => {
       //console.log("action", res);
        dispatch(signupSuccessAction(res));
      })
      // .catch((res) => {
      //   console.log("action catch", res);
      //   dispatch(signupFailureAction(res));
      // });
  }catch (error) {
    dispatch(signupFailureAction(error));
    console.log(error)
  }
};


// send message
export const sendMail = (payload) => async (dispatch) => {
  //console.log("action", payload);
  dispatch(signinRequestAction());
  try {
    return await axios
      .post(`${url2}/admin/message`, payload)
      
  } catch (error) {
    dispatch(sendMessageFailureAction());
  }
};


