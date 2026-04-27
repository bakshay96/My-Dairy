import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteRates, getRates, postRates } from "../Services/rateServices";
import { toast } from "react-toastify";

// service methods
export const getMilkRates = createAsyncThunk(
	"get/rates",
	async ({ token }, { rejectWithValue }) => {
		try {
			const response = await getRates(token);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || { message: error.message });
		}
	}
);

// post Milk Rates;

export const addAndUpdateMilkRates = createAsyncThunk(
	"post/rates",
	async ({ token, newRate }, { rejectWithValue }) => {
		try {
			const response = await postRates(token, newRate);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || { message: error.message });
		}
	}
);

// delete rate collection by id
export const deleteMilkRates = createAsyncThunk(
	"delete/rate",
	async ({ token, id }, { rejectWithValue }) => {
		try {
			const response = await deleteRates(token, id);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || { message: error.message });
		}
	}
);

// Slices
export const rateSlice = createSlice({
	name: "rate",
	initialState: {
		rates: [],
		loading: false,
		error: null,
	},
	reducers: {},
	extraReducers: (builder) => {
		builder

			// get rates
			.addCase(getMilkRates.pending, (state) => {
				state.loading = true;
			})

			.addCase(getMilkRates.fulfilled, (state, action) => {
				//console.log(action);
				state.loading = false;
				state.rates = action.payload.rates;
				// Removed toast on fetch - not needed for routine data loading
			})
			.addCase(getMilkRates.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload?.message || 'Failed to fetch rates';
				// Don't show toast on error - let the component handle it
			})

			// post new Rates
			.addCase(addAndUpdateMilkRates.pending, (state) => {
				state.loading = true;
			})

			.addCase(addAndUpdateMilkRates.fulfilled, (state, action) => {
				//console.log(action);
				

				state.loading = false;
				const updatedRate = action.payload.rate;

				// Find the index of the existing rate based on _id (more accurate)
				const index = state.rates.findIndex(
					(rate) => rate._id === updatedRate._id
				);

				if (index >= 0) {
					// If rate exists, update it
					state.rates[index] = updatedRate;
				} else {
					// If rate does not exist, add it to the array
					state.rates.push(updatedRate);
				}
				// Removed toast - handled in component
			})
			.addCase(addAndUpdateMilkRates.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload?.message || 'Failed to update rate';
			})

			// delete rate by id;

			.addCase(deleteMilkRates.pending, (state) => {
				state.loading = true;
			})
			.addCase(deleteMilkRates.fulfilled, (state, action) => {
				//console.log(action)
				state.loading = false;
				state.rates = state.rates.filter(
					(item) => item._id !== action.payload.rate._id
				);
				toast.success(action.payload.message || "Entry deleted successfully!");
			})
			.addCase(deleteMilkRates.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload?.message || 'Failed to delete rate';
				// Toast is handled in the component
			});
	},
});
