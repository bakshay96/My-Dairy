import axios from "axios"
import { url2 } from "../Api/api";

const API_URL = `${url2}/farmer`;

export const addNewFarmer= async (value,token) =>
{
    
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	};
	const response = await axios.post(`${API_URL}/register`,value, config);
	
	return response.data;
};

export const fetchFarmers = async (token) =>{
   
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	};
	const response = await axios.get(`${API_URL}/`, config);
	
	return response.data;
}

export const deleteFarmer = async (id,token) =>{
	
   
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	};
	const response = await axios.delete(`${API_URL}/${id}`, config);
	
	return response.data;
}
