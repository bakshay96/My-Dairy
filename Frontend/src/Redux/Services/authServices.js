import api from "../../services/api";

export const registerUser = async (userData) => {
	const response = await api.post(`/admin/register`, userData);
	return response.data;
};

export const loginUser = async (userData) => {
	const response = await api.post(`/admin/login`, userData);
	return response.data;
};

export const logoutUser = async (token) => {
	localStorage.removeItem("token");
	return true;
};

export const currentUser = async (token) => {
	const response = await api.get(`/admin/me`);
	return response.data;
};
