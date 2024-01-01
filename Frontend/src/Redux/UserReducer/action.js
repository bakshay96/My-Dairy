//Write the ActionCreator functions here
import axios from "axios";
import * as types from "./actionTypes" ;

export const addUserRequestAction = () => {
  return { type: types.FARMER_USER_REQUEST };
};

export const addUserSuccessAction = (payload) => {
  return { type: types.FARMER_USER_SUCCESS, payload };
};

export const addUserFailureAction = (payload) => {
  return { type: types.FARMER_USER_FAILURE,payload };
};


//GET USER DETAILS
export const getUserRequestAction = () => {
  return { type: types.GET_FARMER_REQUEST };
};

export const getUserSuccessAction = (payload) => {
  return { type: types.GET_FARMER_SUCCESS, payload };
};

export const getUserFailureAction = () => {
  return { type: types.GET_FARMER_FAILURE };
};


//=============Functions currying js ==========================================================================
const url = "https://milkify.cyclic.app/api";
const url2 = "https://dudhsankalan-ab.onrender.com/api";

// admin signin function


//add farmer function
export const addFarmer = (payload) => async (dispatch) => {
  console.log("action", payload);
  dispatch(addUserRequestAction());
  try {
    return  await axios
      .post(`http://localhost:8080/api/user/register`, payload)
      
  } catch (error) {
    dispatch(addUserFailureAction(error.message));
  }
};

//get All Farmer details

export const getFarmersDetails = (payload) => async (dispatch) => {
  //console.log("action", payload);
  dispatch(getUserRequestAction());
  try {
      await axios 
    .get(`http://localhost:8080/api/user/`)
    .then((res)=>{
      dispatch(getUserSuccessAction(res.data));
      console.log("action user detials",res.data);
    }).catch((error)=>{
      console.log("error",error)
      dispatch(getUserFailureAction());
    })
      
  } catch (error) {
    dispatch(getUserFailureAction());
  }
};
