import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { addNewFarmer, deleteFarmer, fetchFarmers } from "../Services/farmerServices";
import { toast } from "react-toastify";

// service methods
export const addFarmer = createAsyncThunk('/add/farmer', async ({value,token},{rejectWithValue}) =>{
    try {
        const response =await addNewFarmer(value,token);
        return response;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
})


// fetch farmer details
export const getFarmersDetails = createAsyncThunk('/get/farmer', async (token,{rejectWithValue}) =>{
    try {
        const response =await fetchFarmers(token);
      
        return response;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
})

export const DeleteFarmerAccount = createAsyncThunk('/delete/farmer', async ({id,token},{rejectWithValue}) =>{
    try {
        const response =await deleteFarmer(id,token);
       
        return response;
    } catch (error) {
        return rejectWithValue(error.response.data);
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
            state.error=true;
            state.status=action.payload.error;
            toast.error(action.payload.error || "Something wen't wrong");
           

        })


        //get farmer details
        .addCase(getFarmersDetails.pending , (state)=>{
            state.loading=true;

        })

        .addCase(getFarmersDetails.fulfilled, (state,action)=>{
            state.loading=false;
            state.farmerData=action.payload.farmers;
            console.log(state.farmerData)
            toast.success(action.payload.message || "fetched farmers data")
        })

        .addCase(getFarmersDetails.rejected, (state,action)=>{
            
            state.loading=false;
            state.error=true;
            state.status=action.error.message;
            toast.error(action.payload.error|| "Server error...")
            
        })

        //delete farmer 
        .addCase(DeleteFarmerAccount.pending, (state)=>{
            state.loading=true;
        })

        .addCase(DeleteFarmerAccount.fulfilled , (state,action)=>{
            
            state.loading=false;
            state.farmerData=state.farmerData.filter((farmer)=>farmer._id !== action.payload.id)
            
            toast.success(action.payload.message || "farmed account deleted");
        })

        .addCase(DeleteFarmerAccount.rejected , (state,action)=>{
            
            state.loading=false;
            state.error=true;
            state.status=action.error || true;
            toast.error(action.error || "Something wen't wrong");
          

        })
        
    }

})