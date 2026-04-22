import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { addNewFarmer, deleteFarmer, fetchFarmers } from "../Services/farmerServices";
import { toast } from "react-toastify";

// service methods
export const addFarmer = createAsyncThunk('/add/farmer', async ({value,token},{rejectWithValue}) =>{
    try {
        const response =await addNewFarmer(value,token);
        return response;
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: error.message });
    }
})


// fetch farmer details
export const getFarmersDetails = createAsyncThunk('/get/farmer', async (token,{rejectWithValue}) =>{
    try {
        const response =await fetchFarmers(token);
        return response;
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: error.message });
    }
})

export const DeleteFarmerAccount = createAsyncThunk('/delete/farmer', async ({id,token},{rejectWithValue}) =>{
    try {
        const response =await deleteFarmer(id,token);
        return response;
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: error.message });
    }
})

//Note : Do NOT MODIFY the intial state structure
const initialState={
    farmerData:[],
    loading:false,
    error:null,
    status:null,
    
}
export const farmerSlice =createSlice({
    name:"farmer",
    initialState,
    reducers:{},
    extraReducers:(builder)=>{
        builder

        // add new faramer
        .addCase(addFarmer.pending, (state)=>{
            state.loading=true;
        })

        .addCase(addFarmer.fulfilled , (state,action)=>{
            state.loading=false;
            toast.success(action.payload.msg || "farmed added successfully");
        })

        .addCase(addFarmer.rejected , (state,action)=>{
            state.loading=false;
            state.error = action.payload?.message || 'Failed to add farmer';
            state.status = action.payload?.error || null;
        })


        //get farmer details
        .addCase(getFarmersDetails.pending , (state)=>{
            state.loading=true;

        })

        .addCase(getFarmersDetails.fulfilled, (state,action)=>{
            state.loading = false;
            const data = action.payload.data || action.payload;
            state.farmerData = data.farmers || data;
            // Removed toast on fetch - not needed for routine data loading
        })

        .addCase(getFarmersDetails.rejected, (state,action)=>{
            state.loading=false;
            state.error = action.payload?.message || 'Failed to fetch farmers';
            state.farmerData = [];
        })

        //delete farmer 
        .addCase(DeleteFarmerAccount.pending, (state)=>{
            state.loading=true;
        })

        .addCase(DeleteFarmerAccount.fulfilled , (state,action)=>{
            state.loading = false;
            const data = action.payload.data || action.payload;
            const targetId = data.id || data.farmerId;
            state.farmerData = state.farmerData.filter((farmer) => farmer._id !== targetId);
            toast.success(action.payload.message || "Farmer account deleted");
        })

        .addCase(DeleteFarmerAccount.rejected , (state,action)=>{
            state.loading=false;
            state.error = action.payload?.message || 'Failed to delete farmer';
            state.status = action.payload?.error || null;
        })
        
    }

})