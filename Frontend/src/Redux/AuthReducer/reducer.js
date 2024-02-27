import * as types from "./actionTypes";

// NOTE: DO NOT MODIFY the intial state structure in this file.
export const initialState = {
  token:localStorage.getItem("token") || null,
  isAuthenticated:localStorage.getItem("token")!==null?true:false,
  user:null,
  isLoading: false,
  isError: false,
  
};

export const reducer = (state = initialState, action) => {
  const {type,payload}=action;

  switch(type)
  {
    
   
    //SignIn
    
    case types.USER_SIGNIN_REQUEST:
      return {...state, isLoading:true};
    
    case types.USER_SIGNIN_SUCCESS:
      return {...state,
        isAuthenticated: true,
        // user: payload.userName,
        token: payload
      };
    
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
      return {...state,  isAuthenticated:false, token:null,isLoading:false }


      //Message
    case types.USER_MESSAGE_SUCCESS:
      return {...state,isLoading:false, statusCode:payload}
    
    case types.USER_SIGNUP_FAILURE:
      return {...state, isError:true, isLoading:false,}
    
    default:
      return state;
  }
};


