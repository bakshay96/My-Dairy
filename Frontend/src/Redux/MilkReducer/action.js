import axios from "axios";
import * as types from "./actionTypes";

//POST
export const addMilkRequestAction = ()=>{
    return {type:types.ADD_MILK_REQUEST}
}

export const addMilkSuccessAction =(payload)=>{
    return {type:types.ADD_MILK_SUCCESS,payload}
}

export const addMilkFailureAction =()=>{
    return {type:types.ADD_MILK_FAILURE}
}

//GET 
export const getMilkRequestAction = ()=>{
    return {type:types.GET_MILK_REQUEST}
}

export const getMilkSuccessAction =(payload)=>{
    return {type:types.GET_MILK_SUCCESS,payload}
}

export const getMilkFailureAction =()=>{
    return {type:types.GET_MILK_FAILURE}
}

//================function for api request =====================

export const addMilk =(payload)=>async(dispatch)=>{
console.log("action milk payload",payload.mobile,payload);
    dispatch(addMilkRequestAction());
return   await axios.post(`http://localhost:8080/api/milk/add/${payload.mobile}`,payload)
    
    .catch((res)=>{
        console.log("add milk err",res.data);
        dispatch(addMilkFailureAction(res.data));
    })
    
}

//get milk data
export const getMilkDetails =(payload)=>async(dispatch)=>{
   console.log("get milk action payload",payload)

        dispatch(getMilkRequestAction());
        await axios.get(`http://localhost:8080/api/milk/get/${payload}`)
        .then((res)=>{
            console.log("action get milk data res",res.data);
            dispatch(getMilkSuccessAction(res.data));
        })
        .catch((res)=>{
            console.log("get milk err",res.data);
            dispatch(getMilkFailureAction(res.data));
        })
        
    }