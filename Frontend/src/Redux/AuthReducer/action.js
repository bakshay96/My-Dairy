//Write the ActionCreator functions here
import axios from "axios";
import * as types from "./actionTypes";

const login= (payload)=>async (dispatch)=>{

    dispatch({type:types.LOGIN_REQUEST});

    try {
        const r = await axios
            .post("https://milkify.cyclic.app/api/admin/login", payload);
            
        dispatch({ type: types.LOGIN_SUCCESS, payload: r.data.token });
    } catch (e) {
        dispatch({ type: types.LOGIN_FAILURE });
    }
};


const register =(payload)=>async(dispatch)=>{
    dispatch({type:types.SIGNUP_REQUEST});
    try {
        const r = await axios
            .post("https://milkify.cyclic.app/api/admin/register", payload);
            
        dispatch({ type: types.SIGNUP_SUCCESS, payload: r.data.token });
    } catch (error) {
        dispatch({type:types.SIGNUP_FAILURE});
    }
}

export {login};
