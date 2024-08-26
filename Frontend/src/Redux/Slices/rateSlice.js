import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteRates, getRates, postRates } from "../Services/rateServices";
import { toast } from "react-toastify";

// service methods
export const getMilkRates = createAsyncThunk(
	"get/rates",
	async ({ token }, { rejectWithValue }) => {
		//console.log(token);
		try {
			const response = await getRates(token);
			return response;
		} catch (error) {
			return rejectWithValue(error.reponse.data);
		}
	}
);

// post Milk Rates;

export const addAndUpdateMilkRates = createAsyncThunk(
	"post/rates",
	async ({ token, newRate }, { rejctWithValue }) => {
		try {
			//console.log(token, newRate);
			const response = await postRates(token, newRate);
			return response;
		} catch (error) {
			return rejctWithValue(error.response.data);
		}
	}
);

// delete rate collection by id
export const deleteMilkRates = createAsyncThunk(
	"delete/rate",
	async ({ token, id }, { rejctWithValue }) => {
		try {
			//console.log(token, id);
			const response = await deleteRates(token, id);
			return response;
		} catch (error) {
			return rejctWithValue(error.response.data);
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
				toast.success(action.payload.message || "fetch rates data");
			})
			.addCase(getMilkRates.rejected, (state, action) => {
				state.loading = false;
				state.error = true;
				toast.error(action.payload.error.message || "rejct getting data");
			})

			// post new Rates
			.addCase(addAndUpdateMilkRates.pending, (state) => {
				state.loading = true;
			})

			.addCase(addAndUpdateMilkRates.fulfilled, (state, action) => {
				//console.log(action);
				

				state.loading = false;
				const updatedRate = action.payload.rate;

				// Find the index of the existing rate based on milkCategory
				const index = state.rates.findIndex(
					(rate) => rate.milkCategory === updatedRate.milkCategory
				);

				if (index >= 0) {
					// If rate exists, update it
					state.rates[index] = updatedRate;
				} else {
					// If rate does not exist, add it to the array
					state.rates.push(updatedRate);
				}
				toast.success(action.payload.message || "rate updated");
			})
			.addCase(addAndUpdateMilkRates.rejected, (state, action) => {
				//console.log(action);
				state.loading = false;
				state.error = true;
				toast.error("Something wen't wrong");
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
				state.error = "Server error";
				toast.error(action.payload.message || "Failed to delete rate entry!");
			});
	},
});
