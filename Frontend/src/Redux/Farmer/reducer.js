import {
  DELETE_PRODUCT_FAILURE,
  DELETE_PRODUCT_REQUEST,
  DELETE_PRODUCT_SUCCESS,
  EDIT_PRODUCT_FAILURE,
  EDIT_PRODUCT_REQUEST,
  EDIT_PRODUCT_SUCCESS,
  GET_PRODUCT_FAILURE,
  GET_PRODUCT_REQUEST,
  GET_PRODUCT_SUCCESS,
  POST_PRODUCT_FAILURE,
  POST_PRODUCT_REQUEST,
  POST_PRODUCT_SUCCESS,
} from "./actionTypes";

const initialState = {
  products: [],
  isLoading: false,
  isError: false,
  totalPages:0,
};

export const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case POST_PRODUCT_REQUEST:
      return { ...state, isLoading: true };
    case POST_PRODUCT_SUCCESS:
      return { ...state, isLoading: false };
    case POST_PRODUCT_FAILURE:
      return { ...state, isLoading: false, isError: true };

    // get product
    case GET_PRODUCT_REQUEST:
      return { ...state, isLoading: true };
    case GET_PRODUCT_SUCCESS:
      return { ...state, isLoading: false, products: payload };
    case GET_PRODUCT_FAILURE:
      return { ...state, isLoading: false, isError: true };

    //edit product
    case EDIT_PRODUCT_REQUEST:
      return { ...state, isLoading: true };
    case EDIT_PRODUCT_SUCCESS:
      return { ...state, isLoading: false };
    case EDIT_PRODUCT_FAILURE:
      return { ...state, isLoading: false, isError: true };

    //delete
    case DELETE_PRODUCT_REQUEST:
      return { ...state, isLoading: true };
    case DELETE_PRODUCT_SUCCESS:
      return { ...state, isLoading: false };
    case DELETE_PRODUCT_FAILURE:
      return { ...state, isLoading: false, isError: true };


    default:
      return state;
  }
};
