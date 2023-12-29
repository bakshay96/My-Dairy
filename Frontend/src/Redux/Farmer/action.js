User
import axios from "axios";
import {  DELETE_FAILURE, DELETE_REQUEST, DELETE_SUCCESS, GET_FAILURE, GET_REQUEST, GET_SUCCESS, PATCH_FAILURE, PATCH_REQUEST, PATCH_SUCCESS, POST_FAILURE, POST_REQUEST, POST_SUCCESS } from "./actionTypes";
export const postMilkRequestAction = () => {
  return { type: POST_REQUEST };
};

export const postMilkSuccessAction = () => {
  return { type: POST_SUCCESS };
};

export const postMilkFailureAction = () => {
  return { type:POST_FAILURE  };
};

//get product
export const getMilkRequestAction = () => {
  return { type: GET_REQUEST};
};

export const getMilkSuccessAction = (payload) => {
  return { type:GET_SUCCESS ,payload};
};

export const getMilkFailureAction = () => {
  return { type:GET_FAILURE };
};


//Edit product

export const editMilkRequestAction = () => {
    return { type: PATCH_REQUEUser }
}
  
export const editMilkSuccessAction = () => {
    return { type: PATCH_SUCCESS};
  };
  
  export const editMilkFailureAction = () => {
    return { type: PATCH_FAILURE };
  };


  // delete
  export const deleteMilkRequestAction = () => {
    return { type: DELETE_REQUEST};
  };
  
  export const deleteMilkSuccessAction = () => {
    return { type: DELETE_SUCCESS};
  };
  
  export const deleteMilkFailureAction = () => {
    return { type: DELETE_FAILURE};
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

  