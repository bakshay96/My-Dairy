// storySlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import { getmilkData, postMilkData } from '../Services/milkServices';

// Async thunk to get stories
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

// Async thunk to add new milk data
export const addMilk = createAsyncThunk('milk/add/post', async ({value,token }, { rejectWithValue }) => {
  try {
    //console.log("add milk",value,token)
    const response = await postMilkData(value,token);
    return response;
  } catch (error) {
    console.log(error)
    return rejectWithValue(error.response.data);
  }
});


// Async thunk to post milk data
export const fetchStoryById = createAsyncThunk('stories/get/:id', async ({id,token}, { rejectWithValue }) => {
  try {
    const response = await getStoryById({id,token});
    return response;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});


// Async thunk to update a story
export const updateExistingStory = createAsyncThunk('stories/update:id', async ({ id, text, token }, { rejectWithValue }) => {
  try {
   // console.log(id,text,token)
    const response = await updateStory(id, text, token);
    return response;
  } catch (error) {
   // console.log(error)
    return rejectWithValue(error.response.data);
  }
});

// Async thunk to delete a story
export const deleteExistingStory = createAsyncThunk('stories/deleteExistingStory', async ({ id, token }, { rejectWithValue }) => {
  try {
    const response = await deleteStory(id, token);
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
        console.log(action)
        state.loading = false;
        console.log("case",action.payload)
        state.data = action.payload.data;
        toast.success('records loaded successfully!');
      })
      .addCase(getMilkDetails.rejected, (state, action) => {
        console.log(action)
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
        console.log("payload",action);
        toast.success(`${action.payload.message}`||'milk data added successfully!');
      })
      .addCase(addMilk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error;
        toast.error(action.payload.error || 'Failed to add milk data!');
      })



      //get story by id
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
      .addCase(updateExistingStory.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateExistingStory.fulfilled, (state, action) => {
        state.loading = false;
        state.stories = state.stories.map((story) =>
          story._id === action.payload._id ? action.payload : story
        );
        toast.success('Story updated successfully!');
      })
      .addCase(updateExistingStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || 'Failed to update story!');
      })

      //delete story by id
      .addCase(deleteExistingStory.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteExistingStory.fulfilled, (state, action) => {
        state.loading = false;
        state.stories = state.stories.filter((story) => story._id !== action.payload.id);
        toast.success('Story deleted successfully!');
      })
      .addCase(deleteExistingStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload.message || 'Failed to delete story!');
      });
  },
});


