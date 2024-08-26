import axios from "axios";
import { toast } from "react-toastify";
import { url2 } from "../Api/api";

const API_URL = `${url2}/admin/`;

export const registerUser = async (userData) => {
	const response = await axios.post(`${API_URL}register`, userData);
	//console.log("try", response.data);

	return response.data;
};

export const loginUser = async (userData) => {
	//console.log(userData);

	const response = await axios.post(`${API_URL}login`, userData);
	//console.log(response.data);

	return response.data;
};

export const logoutUser = async (token) => {
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	};
	//console.log("auth ",token);
	//const response = await axios.post(`${API_URL}logout`,"",config);
	localStorage.removeItem("token");

	return true;
};

export const currentUser = async (token) => {
	//console.log(token)
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	};

	const response = await axios.get(`${API_URL}me`, config);
	//console.log(response.data);
	return response.data;
};
