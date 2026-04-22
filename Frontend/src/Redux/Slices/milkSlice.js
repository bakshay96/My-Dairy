import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import { deleteMilkEntry, getmilkData, postMilkData, updateMilkEntry } from '../Services/milkServices';

// Async thunk to get milk detail by farmer id;
export const getMilkDetails = createAsyncThunk('milk/get', async ({ value, token }, { rejectWithValue }) => {
  try {
    const response = await getmilkData(value);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// Async thunk to add new milk entry in farmer account.
export const addMilk = createAsyncThunk('milk/add', async ({ value, token }, { rejectWithValue }) => {
  try {
    const response = await postMilkData(value);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// Async thunk to update a milk entry by id;
export const updateExistingMilkEntry = createAsyncThunk('milk/update', async ({ id, payload, token }, { rejectWithValue }) => {
  try {
    const response = await updateMilkEntry(id, payload);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// Async thunk to delete a milk entry by id
export const deleteExistingMilkEntry = createAsyncThunk('milk/delete', async ({ id, token }, { rejectWithValue }) => {
  try {
    const response = await deleteMilkEntry(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});

// Initial state
const initialState = {
  data: null,
  loading: false,
  error: null,
};

// Milk slice
export const milkSlice = createSlice({
  name: 'milk',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // get milk data
      .addCase(getMilkDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMilkDetails.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data || action.payload;
        state.data = Array.isArray(data) ? data : (data.milkData || []);
        state.error = null;
        // Don't show toast here - let the component handle it if needed
      })
      .addCase(getMilkDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load details';
        state.data = [];
        // Don't show toast here - let the component handle it
      })

      // add new milk details
      .addCase(addMilk.pending, (state) => {
        state.loading = true;
      })
      .addCase(addMilk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Don't show toast here - let the component handle it
        
        // If we have the current farmer's data loaded, add the new entry
        if (Array.isArray(state.data) && action.payload.milk) {
          state.data.push(action.payload.milk);
        }
      })
      .addCase(addMilk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to add milk data';
        // Don't show toast here - let the component handle it
      })

      // update milk entry
      .addCase(updateExistingMilkEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateExistingMilkEntry.fulfilled, (state, action) => {
        state.loading = false;
        const updatedEntry = action.payload.data || action.payload;
        if (Array.isArray(state.data)) {
          state.data = state.data.map((entry) =>
            entry._id === updatedEntry._id ? updatedEntry : entry
          );
        }
        state.error = null;
        // Don't show toast here - let the component handle it
      })
      .addCase(updateExistingMilkEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update entry';
        // Don't show toast here - let the component handle it
      })

      // delete milk entry by id
      .addCase(deleteExistingMilkEntry.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteExistingMilkEntry.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.data)) {
          const deletedId = action.payload.data?._id || action.payload;
          state.data = state.data.filter((entry) => entry._id !== deletedId);
        }
        state.error = null;
        // Don't show toast here - let the component handle it
      })
      .addCase(deleteExistingMilkEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete milk entry';
        // Don't show toast here - let the component handle it
      });
  },
});
