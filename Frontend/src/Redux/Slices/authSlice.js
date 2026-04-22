import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { toast } from "react-toastify";
import {
	currentUser,
	loginUser,
	logoutUser,
	registerUser,
} from "../Services/authServices";

export const register = createAsyncThunk(
	"auth/register",
	async (userData, { rejectWithValue }) => {
		try {
			return await registerUser(userData);
		} catch (error) {
			//console.log("slice error", error);
			//toast.error(`${error.response.data.status} ${error.response.data.message}`)

			return rejectWithValue(error.response.data);
		}
	}
);

export const login = createAsyncThunk(
	"auth/login",
	async (userData, { rejectWithValue }) => {
		try {
			return await loginUser(userData);
		} catch (error) {
			//console.log(error);
			return rejectWithValue(error);
		}
	}
);

export const existingUser = createAsyncThunk(
	"auth/me",
	(token, { rejectWithValue }) => {
		try {
			return currentUser(token);
		} catch (error) {
			//console.log(error);
			return rejectWithValue(error.response.data);
		}
	}
);

export const logout = createAsyncThunk(
	"auth/logout",
	async (token, { rejectWithValue }) => {
		try {
			return await logoutUser(token);
		} catch (error) {
			//console.log("logout", error);
			return rejectWithValue(error.response.data);
		}
	}
);

export const authSlice = createSlice({
	name: "auth",
	initialState: {
		user: null,
		token: localStorage.getItem("token") || null,
		loading: false,
		error: null,
	},
	reducers: {
		setUser: (state, action) => {
			state.user = action.payload;
		},
	},

	extraReducers: (builder) => {
		builder

			//registration
			.addCase(register.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(register.fulfilled, (state, action) => {
				state.loading = false;
				state.error = null;
				const data = action.payload.data || action.payload;
				// Handle both old and new response structures
				state.user = data.admin || data.user || null;
				state.token = data.token;
				if (data.token) {
					localStorage.setItem("token", data.token);
				}
				const userName = (data.admin || data.user)?.name || 'User';
				toast.info(`${userName}, Welcome to Milkify`);
				toast.success(action.payload.message || "Registration successful!");
			})
			.addCase(register.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload?.message || action.error?.message || "Registration failed";
				toast.error(state.error);
			})

			//login
			.addCase(login.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(login.fulfilled, (state, action) => {
				state.loading = false;
				state.error = null;
				const data = action.payload.data || action.payload;
				state.user = data.admin || null;
				state.token = data.token;
				if (data.token) {
					localStorage.setItem("token", data.token);
				}
				toast.success(action.payload.message || "Login successful!");
				if (data.admin?.name) {
					toast.info(`Welcome back, ${data.admin.name}`);
				}
			})
			.addCase(login.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload?.message || action.error?.message || "Login failed";
				toast.error(state.error);
			})

			//logout
			.addCase(logout.pending, (state) => {
				state.loading = true;
			})
			.addCase(logout.fulfilled, (state, action) => {
				state.loading = false;
				state.user = null;
				state.token = null;
			})

			.addCase(logout.rejected, (state) => {
				state.loading = false;
				state.error = true;
				toast.info("Logged out fail..!");
			})

			// current user
			.addCase(existingUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})

			.addCase(existingUser.fulfilled, (state, action) => {
				state.loading = false;
				state.error = null;
				const data = action.payload.data || action.payload;
				state.user = data.admin || null;
				toast.success(action.payload.message || "User auto login");
			})

			.addCase(existingUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload?.message || "Authentication failed";
				// Clear invalid token
				state.user = null;
				state.token = null;
				localStorage.removeItem("token");
			});
	},
});

export const { setUser } = authSlice.actions;
