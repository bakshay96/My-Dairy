import * as types from "./actionTypes";

// NOTE: DO NOT MODIFY the intial state structure in this file.
export const initialState = {
  isAuth: false,
  token: localStorage.getItem("token") || "",
  isLoading: false,
  isError: false,
  signupStatus:false,
  adminName:""
};

export const reducer = (state = initialState, action) => {
  const {type,payload}=action;

  switch(type)
  {
    
   
    //SignIn
    
    case types.USER_SIGNIN_REQUEST:
      return {...state, isLoading:true};
    
    case types.USER_SIGNIN_SUCCESS:
      return {...state, isLoading:false, isAuth:true, token:payload};
    
    case types.USER_SIGNIN_FAILURE:
      return {...state, isLoading:false, isError:true};

    // SignUp

    case types.USER_SIGNUP_REQUEST:
      return {...state,isLoading:true};
    
    case types.USER_SIGNUP_SUCCESS:
      return {...state,isLoading:false, signupStatus:payload}
    
    case types.USER_SIGNUP_FAILURE:
      return {...state, isError:true, isLoading:false,}

    case types.USER_LOGOUT_SUCCESS:
      return {...state, isAuth:false, token:""}
    
    default:
      return state;
  }
};


