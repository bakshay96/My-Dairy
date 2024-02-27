//Write the ActionCreator functions here
import axios from "axios";
import * as types from "./actionTypes" ;
import {localhost, url,url2} from "../Api/api"

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
// const url = "https://milkify.cyclic.app/api";
// const url2 = "https://dudhsankalan-ab.onrender.com/api";

// admin signin function


//add farmer function
export const addFarmer = ({value,token}) => async (dispatch) => {
  //console.log("add user action", value,token);
  dispatch(addUserRequestAction());
  try {
    return  await axios
      .post(`${localhost}/api/user/register`,value,{
        headers: {
          'Authorization':`Bearer ${token}`,
        }
      })
      
  } catch (error) {
    dispatch(addUserFailureAction(error.message));
  }
};

//get All Farmer details

export const getFarmersDetails = ({token}) => async (dispatch) => {
  //console.log("farmer details action", token);
  dispatch(getUserRequestAction());
  try {
      await axios 
    .get(`${localhost}/api/user/`,
    {
      headers: {
        'Authorization':`Bearer ${token}`
      }
    })
    .then((res)=>{

      dispatch(getUserSuccessAction(res.data));
     // console.log("action user detials",res.data);
    }).catch((error)=>{
      //console.log("error",error)
      dispatch(getUserFailureAction());
    })
      
  } catch (error) {
    dispatch(getUserFailureAction());
  }
};

