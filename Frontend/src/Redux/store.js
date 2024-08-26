// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './Slices/authSlice';
import { milkSlice } from './Slices/milkSlice';
import { farmerSlice } from './Slices/farmerSlice';
import { rateSlice } from './Slices/rateSlice';

const authReducer=authSlice.reducer;
const milkReducer=milkSlice.reducer;
const farmerReducer=farmerSlice.reducer;
const rateReducer = rateSlice.reducer;

export const store = configureStore({
  reducer: {
    auth: authReducer,
    farmer: farmerReducer,
    milk: milkReducer,
    rate: rateReducer,
    
  },
});
