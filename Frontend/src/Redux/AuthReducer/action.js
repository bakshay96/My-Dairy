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
const signupRequestAction = () => {
  return { type: types.USER_SIGNUP_REQUEST };
};

const signupSuccessAction = (payload) => {
  console.log(payload);
  return { type: types.USER_SIGNUP_SUCCESS, payload };
};

const signupFailureAction = () => {
  // console.log(payload);
  return { type: types.USER_SIGNUP_FAILURE };
};

//=============Functions currying js ==========================================================================
const url = "https://milkify.cyclic.app/api";
const url2 = "https://dudhsankalan-ab.onrender.com/api";

//signin function
export const signin = (payload) => async (dispatch) => {
  console.log("action payload", payload);
  dispatch(signinRequestAction());
  return await axios
    .post(`http://localhost:8080/api/admin/login`, payload)
    .then((res) => {
      console.log("action", res);
      dispatch(signinSuccessAction(res.data.token));
    })
    .catch((res) => {
      console.log("action catch", res);
      dispatch(signupFailureAction());
    });
};

//signup function
export const signup = (payload) => async (dispatch) => {
  console.log("action", payload);
  dispatch(signupRequestAction());
  try {
    return await axios
      .post(`http://localhost:8080/api/admin/register`, payload)
      .then((res) => {
        console.log("action", res);
        dispatch(signupSuccessAction(true));
      })
      .catch((res) => {
        console.log("action catch", res);
        dispatch(signupFailureAction());
      });
  } catch (error) {
    dispatch(signupFailureAction());
  }
};
