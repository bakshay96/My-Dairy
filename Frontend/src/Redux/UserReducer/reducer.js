import * as types from "./actionTypes";
// NOTE: DO NOT MODIFY the intial state structure in this file.
const initialState = {
  data:[],
  isLoading: false,
  isError: false,
  isUserAdded:false,
  response:null,
};

export const reducer = (state = initialState, action) => {
  const {type,payload}=action;

  switch(type)
  {
    //add farmer user
    case types.FARMER_USER_REQUEST:
      return {...state, isLoading:true};
    
    case types.FARMER_USER_SUCCESS:
      return {...state, isLoading:false, isUserAdded:true, response:payload};
    
    case types.FARMER_USER_FAILURE:
      return {...state, isLoading:false, isError:true, response:payload};

    
    //get user details
    case types.GET_FARMER_REQUEST:
      return {...state, isLoading:true,}
    
      case types.GET_FARMER_SUCCESS:
        return {...state, isLoading:false, data:payload};
      
      case types.GET_FARMER_FAILURE:
        return {...state, isLoading:false, isError:true};

    default:
      return state;
  }
};


