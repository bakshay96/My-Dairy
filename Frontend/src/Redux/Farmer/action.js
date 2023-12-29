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
import axios from "axios";
export const postProductRequestAction = () => {
  return { type: POST_PRODUCT_REQUEST };
};

export const postProductSuccessAction = () => {
  return { type: POST_PRODUCT_SUCCESS };
};

export const postProductFailureAction = () => {
  return { type: POST_PRODUCT_FAILURE };
};

//get product
export const getProductRequestAction = () => {
  return { type: GET_PRODUCT_REQUEST };
};

export const getProductSuccessAction = (payload) => {
  return { type: GET_PRODUCT_SUCCESS ,payload};
};

export const getProductFailureAction = () => {
  return { type: GET_PRODUCT_FAILURE };
};


//Edit product

export const editProductRequestAction = () => {
    return { type: EDIT_PRODUCT_REQUEST };
  };
  
  export const editProductSuccessAction = () => {
    return { type: EDIT_PRODUCT_SUCCESS};
  };
  
  export const editProductFailureAction = () => {
    return { type: EDIT_PRODUCT_FAILURE };
  };


  // delete
  export const deleteProductRequestAction = () => {
    return { type: DELETE_PRODUCT_REQUEST };
  };
  
  export const deleteProductSuccessAction = () => {
    return { type: DELETE_PRODUCT_SUCCESS};
  };
  
  export const deleteProductFailureAction = () => {
    return { type: DELETE_PRODUCT_FAILURE };
  };

  // post function
export const postProduct = (newProduct) => (dispatch) => {
  dispatch(postProductRequestAction());
  return axios
    .post(`https://mock-server-6nea.onrender.com/products`, newProduct)
    .then(() => {
      dispatch(postProductSuccessAction());
    })
    .catch((err) => {
      dispatch(postProductFailureAction());
    });
};

// editProduct

export const editProduct = (id,productData) => (dispatch) => {
    dispatch(editProductRequestAction());
    return axios
      .patch(`https://mock-server-6nea.onrender.com/products/${id}`, productData)
      .then(() => {
        dispatch(editProductSuccessAction());
      })
      .catch((err) => {
        dispatch(editProductFailureAction());
      });
  };



  // function delete
  export const deleteProduct = (id) => (dispatch) => {
    dispatch(deleteProductRequestAction());
    return axios
      .delete(`https://mock-server-6nea.onrender.com/products/${id}`)
      .then(() => {
        dispatch(deleteProductSuccessAction());
      })
      .catch((err) => {
        dispatch(deleteProductFailureAction());
      });
  };


//  get PRODUCT  function
export const getProducts = (page) => (dispatch) => {
    dispatch(getProductRequestAction());
    return axios
      .get(`https://mock-server-6nea.onrender.com/products?page=${page}&limit=10`)
      .then((res) => {
        console.log(res.data)
        dispatch(getProductSuccessAction(res.data));
      })
      .catch((err) => {
        dispatch(getProductFailureAction());
      });
  };

  