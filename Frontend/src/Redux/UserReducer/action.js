//Write the ActionCreator functions here
import axios from "axios";
import * as types from "./actionTypes" ;
import {url2} from "../Api/api"

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

export const getUserFailureAction = (payload) => {
  return { type: types.GET_FARMER_FAILURE,payload };
};


//=============Functions currying js ==========================================================================


// admin signin function


//add farmer function
export const addFarmer = ({value,token}) => async (dispatch) => {
  dispatch(addUserRequestAction());
  try {
    const res = await axios.post(`${url2}/user/register`, value, {
      headers: {
        'Authorization':`Bearer ${token}`,
      }
    });
    dispatch(addUserSuccessAction(res.data));
    return res.data;
  } catch (error) {
    // Extract serializable error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add farmer';
    dispatch(addUserFailureAction(errorMessage));
    throw error;
  }
};

//get All Farmer details

export const getFarmersDetails = ({token}) => async (dispatch) => {
  dispatch(getUserRequestAction());
  try {
      const res = await axios.get(`${url2}/user/`,
        {
          headers: {
            'Authorization':`Bearer ${token}`
          }
        }
      );
      
      if(res.data.err) {
        dispatch(getUserFailureAction(res.data.err));
      } else {
        dispatch(getUserSuccessAction(res.data));
      }
  } catch (error) {
    // Extract serializable error message instead of entire error object
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch farmers';
    dispatch(getUserFailureAction(errorMessage));
  }
};

