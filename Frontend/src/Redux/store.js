// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './Slices/authSlice';
import { milkSlice } from './Slices/milkSlice';
import { farmerSlice } from './Slices/farmerSlice';

const authReducer=authSlice.reducer;
const milkReducer=milkSlice.reducer;
const farmerReducer=farmerSlice.reducer;

export const store = configureStore({
  reducer: {
    auth:authReducer,
    milk:milkReducer,
    farmer:farmerReducer

    
  },
});
