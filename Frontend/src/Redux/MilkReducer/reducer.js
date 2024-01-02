import * as types from "./actionTypes";

const initialState={
    data:[] ||[],
    isMilkAdded:false,
    isLoading:false,
    isError:false,
    response:""
}
export const reducer =(state=initialState,action)=>{
    const {type, payload} =action;

    switch(type)
    {
        case types.ADD_MILK_REQUEST:
            return {...state, isLoading:true}
        
        case types.ADD_MILK_SUCCESS:
            return {...state,isLoading:false, isMilkAdded:payload.status,response:payload.response}
        
        case types.ADD_MILK_FAILURE:
            return {...state,isError:true,response:payload}
        
        //GET
        case types.GET_MILK_REQUEST:
            return {...state, isLoading:true}
        
        case types.GET_MILK_SUCCESS:
            return {...state,isLoading:false, data:payload}
        
        case types.GET_MILK_FAILURE:
            return {...state,isError:true}
        
        
        default:
            return state;
    }
}