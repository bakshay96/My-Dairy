import * as types from "./actionTypes";
import { toast } from 'react-toastify';


// NOTE: DO NOT MODIFY the intial state structure in this file.
export const initialState = {
	token: localStorage.getItem("token") || null,
	user: null,
	loading: false,
	error: null,
	status: "ideal",
};

export const reducer = (state = initialState, action) => {
	const { type, payload } = action;
  console.log(payload)

	switch (type) {
		//login

		case types.USER_SIGNIN_REQUEST:
			return { ...state, loading: true };

		case types.USER_SIGNIN_SUCCESS:
			localStorage.setItem("token", payload.token);
      toast.success(`${payload.msg}` || "Login successfull..!");
      toast.info('Welcome back in Milkify')

			return {
				...state,
				loading: false,
				user: payload.user,
				token: payload.token,
        error:false,
			};

		case types.USER_SIGNIN_FAILURE:
			return { ...state, loading: false, error: true, status: payload };

		// register

		case types.USER_SIGNUP_REQUEST:
			return { ...state, loading: true };

		case types.USER_SIGNUP_SUCCESS:
			localStorage.setItem("token", payload.token);
      toast.success(payload.msg || 'wellcome in Milkify')
      toast.info('setup your online shop in Dashboard section')
			return {
				...state,
				loading: false,
				token: payload.token,
				user: payload.user,
        error:false
			};

		case types.USER_SIGNUP_FAILURE:
			return { ...state, error: true, isLoading: false, status: payload };

		//current user
		case type.CURRENT_USER_REQUEST:
			return { ...state, loading: true };

		case type.CURRENT_USER_SUCCESS:
      toast.success(`${payload.msg}` || "User logged in..")
      
			return {
				...state,
				loading: false,
				user: payload.user,
        error:false
			};
      
    
		case type.CURRENT_USER_FAILURE:
      toast.error(`${payload.msg}` || "Connection Error..!");
			return { ...state, loading: false, error: true,  };

		//logout user
		case types.USER_LOGOUT_REQUEST:
			return { ...state, loading: true };

		case types.USER_LOGOUT_SUCCESS:
			localStorage.setItem("token", null);
      toast.info("User loggedout successfully..")
			return { ...state, loading: false, user: null, token: null };

		case types.USER_LOGOUT_FAILURE:
			return { ...state, loading: false, error: true, status: payload };

		//Message
		case types.USER_MESSAGE_SUCCESS:
			return { ...state, loading: false };

		case types.USER_SIGNUP_FAILURE:
			return { ...state, error: true, loading: false, status: payload };

		default:
			return state;
	}
};
