import api from "../../services/api";

export const addNewFarmer = async (value) => {
	const response = await api.post(`/farmer/register`, value);
	return response.data;
};

export const fetchFarmers = async () => {
	const response = await api.get(`/farmer/`);
	return response.data;
};

export const deleteFarmer = async (id) => {
	const response = await api.delete(`/farmer/${id}`);
	return response.data;
};
