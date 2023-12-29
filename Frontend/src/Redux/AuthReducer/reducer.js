import * as types from "./actionTypes";
// NOTE: DO NOT MODIFY the intial state structure in this file.
const initialState = {
  isAuth: false,
  token: "",
  isLoading: false,
  isError: false,
  response:"",
};

const reducer = (state = initialState, action) => {
  const {type,payload}=action;

  switch(type)
  {
    case types.LOGIN_REQUEST:
      return {...state, isLoading:true};
    
    case types.LOGIN_SUCCESS:
      return {...state, isLoading:false, isAuth:true, token:payload};
    
    case types.LOGIN_FAILURE:
      return {...state, isLoading:false, isError:true};

    // SignUp

    case types.SIGNUP_REQUEST:
      return {...state,isLoading:true};
    
    case types.SIGNUP_SUCCESS:
      return {...state,isLoading:false, response:payload}
    
    case types.SIGNUP_FAILURE:
      return {...state, isError:true, isLoading:false,}
    
    default:
      return state;
  }
};

export { reducer };
