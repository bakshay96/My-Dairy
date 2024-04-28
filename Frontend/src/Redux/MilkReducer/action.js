import axios from "axios";
import * as types from "./actionTypes";
import { localhost, url2 } from "../Api/api";

//POST
export const addMilkRequestAction = () => {
  return { type: types.ADD_MILK_REQUEST };
};

export const addMilkSuccessAction = (payload) => {
  return { type: types.ADD_MILK_SUCCESS, payload };
};

export const addMilkFailureAction = () => {
  return { type: types.ADD_MILK_FAILURE };
};

//GET
export const getMilkRequestAction = () => {
  return { type: types.GET_MILK_REQUEST };
};

export const getMilkSuccessAction = (payload) => {
  return { type: types.GET_MILK_SUCCESS, payload };
};

export const getMilkFailureAction = (payload) => {
  return { type: types.GET_MILK_FAILURE,payload };
};

//================function for api request =====================

export const addMilk =({ value, token }) =>async (dispatch) => {
    //console.log("action milk payload", value, token);

    dispatch(addMilkRequestAction());
    return await axios
      .post(`${url2}/milk/add/${value.mobile}`, value, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      .catch((res) => {
       // console.log("add milk err", res.data);
        dispatch(addMilkFailureAction(res.data));
      });
  };

//get milk data
export const getMilkDetails =({ value, token }) =>async (dispatch) => {
    //console.log("get milk action payload", value,token);

    dispatch(getMilkRequestAction());
    await axios
      .get(`${url2}/milk/get/${value}`,
      {
        headers: {
          'Authorization':`Bearer ${token}`
        }
      })
      .then((res) => {
       // console.log("action get milk data res", res.data);
        dispatch(getMilkSuccessAction(res.data));
      })
      .catch((res) => {
        //console.log("get milk err", res.data);
        dispatch(getMilkFailureAction(res.data));
      });
  };
