
import * as types from "./actionTypes";

// NOTE: DO NOT MODIFY the intial state structure in this file.
export const initialState = {
  token:(localStorage.getItem("token")) || false,
  isAuthenticated:localStorage.getItem("token")!==null?true:false,
  isRegistered:null,
  signupStatus:null,
  user:null,
  isLoading: false,
  isError: null,
  status:null,
  
};

export const reducer = (state = initialState, action) => {
  const {type,payload}=action;

  switch(type)
  {
    
   
    //SignIn
    
    case types.USER_SIGNIN_REQUEST:
      return {...state, isLoading:true,isError:false};
    
    case types.USER_SIGNIN_SUCCESS:
      localStorage.setItem("token",JSON.stringify(payload))
      return {...state,
        isAuthenticate: true,
        isError:false,
        // user: payload.userName,
        token: payload
      };
    
    case types.USER_SIGNIN_FAILURE:
      return {...state, isLoading:false, isError:true};

    // SignUp

    case types.USER_SIGNUP_REQUEST:
      return {...state,isLoading:true,isError:false};
    
    case types.USER_SIGNUP_SUCCESS:
      return {...state,isLoading:false, isError:false,isRegistered:true,status:payload}
    
    case types.USER_SIGNUP_FAILURE:
      return {...state, isError:true, isLoading:false, isRegistered:false,status:payload}

      //logout user
    case types.USER_LOGOUT_SUCCESS:
      localStorage.setItem("token",null)
            return {...state,  isAuthenticated:false,isLoading:false , token:""}

      //Reest 
      case types.RESET_REQUEST:
          return {...state, isRegistered:payload, isError:null}


      //Message
    case types.USER_MESSAGE_SUCCESS:
      return {...state,isLoading:false, statusCode:payload,isError:false}
    
    case types.USER_SIGNUP_FAILURE:
      return {...state, isError:true, isLoading:false,}
    
    default:
      return state;
  }
};


