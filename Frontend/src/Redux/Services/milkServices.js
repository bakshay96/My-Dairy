import api from "../../services/api";

// get single user milk collection data
export const getmilkData = async (farmerId) => {
	const response = await api.get(`/milk/${farmerId}`);
	return response.data;
};

// Function to add new milk data on farmer account by id
export const postMilkData = async (value) => {
	// Validate farmerId before making request
	if (!value || !value.farmerId) {
		throw new Error("Farmer ID is required");
	}
	
	const response = await api.post(`/milk/${value.farmerId}`, value);
	return response.data;
};

export const updateMilkEntry = async (id, payload) => {
	const response = await api.patch(`/milk/${id}`, payload);
	return response.data;
};

export const deleteMilkEntry = async (id) => {
	await api.delete(`/milk/${id}`);
	return id;
};
