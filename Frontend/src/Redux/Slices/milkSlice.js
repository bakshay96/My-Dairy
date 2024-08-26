// storySlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import { deleteMilkEntry, getmilkData, postMilkData, updateMilkEntry } from '../Services/milkServices';

// Async thunk to get milk detail by user id;
export const getMilkDetails = createAsyncThunk('milk/get', async ({token,value}, { rejectWithValue }) => {
  //console.log("thunk token",token,value)
  try {
    const response = await getmilkData(token,value);
   // console.log(response)
    return response;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

// Async thunk to add new milk entry in farmer account.
export const addMilk = createAsyncThunk('milk/add/post', async ({value,token }, { rejectWithValue }) => {
  try {
    //console.log("add milk",value,token)
    const response = await postMilkData(value,token);
    return response;
  } catch (error) {
    //console.log(error)
    return rejectWithValue(error.response.data);
  }
});




// Async thunk to update a milk entry by id;
export const updateExistingMilkEntry = createAsyncThunk('milk/update:id', async ({ id, payload, token }, { rejectWithValue }) => {
  try {
    // console.log(id,text,token)
    const response = await updateMilkEntry(id, payload, token);
    return response;
  } catch (error) {
    // console.log(error)
    return rejectWithValue(error.response.data);
  }
});

// Async thunk to get  milk data for a user data
export const fetchStoryById = createAsyncThunk('stories/get/:id', async ({id,token}, { rejectWithValue }) => {
  try {
    const response = await getStoryById({id,token});
    return response;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});


// Async thunk to delete a milk entry by id
export const deleteExistingMilkEntry = createAsyncThunk('stories/deleteExistingStory', async ({ id, token }, { rejectWithValue }) => {
  try {
    const response = await deleteMilkEntry(id, token);
    return response;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

// Initial state
const initialState = {
  data:null,
  loading: false,
  error: null,
};

// Story slice
export const milkSlice = createSlice({
  name: 'milk',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

    //get milk data
      .addCase(getMilkDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMilkDetails.fulfilled, (state, action) => {
        //console.log(action)
        state.loading = false;
        //console.log("case",action.payload)
        state.data = action.payload.data;
        toast.success('records loaded successfully!');
      })
      .addCase(getMilkDetails.rejected, (state, action) => {
        //console.log(action)
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload.msg || 'Failed to load user milk details!');
      })

      //add new milk details
      .addCase(addMilk.pending, (state) => {
        state.loading = true;
      })
      .addCase(addMilk.fulfilled, (state, action) => {
        state.loading = false;
        //console.log("payload",action);
        toast.success(`${action.payload.message}`||'milk data added successfully!');
      })
      .addCase(addMilk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error;
        toast.error(action.payload.error || 'Failed to add milk data!');
      })



      //get sotry data by id
      .addCase(fetchStoryById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.story = action.payload;
        toast.success('Story loaded successfully!');
      })
      .addCase(fetchStoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload.message || 'Failed to load story!');
      })


      //update story, add contribuiton in the story
      .addCase(updateExistingMilkEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateExistingMilkEntry.fulfilled, (state, action) => {
        //console.log(action)
        state.loading = false;
        state.data=state.data.map((entry)=>{
          if(entry._id==action.payload.data._id)
          {
            return action.payload.data;
          }
          else
          {
            return entry;
          }
        })
        toast.success('entry updated successfully!');
      })
      .addCase(updateExistingMilkEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to update entry!');
      })

      //delete story by id
      .addCase(deleteExistingMilkEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteExistingMilkEntry.fulfilled, (state, action) => {
         //console.log(action)
        state.loading = false;
        state.data = state.data.filter((entry) => entry._id !== action.payload);
        toast.success('Entry deleted successfully!');
      })
      .addCase(deleteExistingMilkEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = "Server error";
        toast.error(action.payload.message || 'Failed to delete milk entry!');
      });
  },
});


