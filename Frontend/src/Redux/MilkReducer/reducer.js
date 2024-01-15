import * as types from "./actionTypes";

const initialState={
    data:[],
    isMilkAdded:false,
    isLoading:false,
    isError:false,
    status:404,
    response:"Initial"
}
export const reducer =(state=initialState,action)=>{
    const {type, payload} =action;

    switch(type)
    {
        case types.ADD_MILK_REQUEST:
            return {...state, isLoading:true}
        
        case types.ADD_MILK_SUCCESS:
            return {...state,isLoading:false, isMilkAdded:true, }
        
        case types.ADD_MILK_FAILURE:
            return {...state,isError:true, isLoading:false,}
        
        //GET
        case types.GET_MILK_REQUEST:
            return {...state, isLoading:true}
        
        case types.GET_MILK_SUCCESS:
            return {...state,isLoading:false, data:payload}
        
        case types.GET_MILK_FAILURE:
            return {...state, isLoading:false, isError:true}
        
        
        default:
            return state;
    }
}