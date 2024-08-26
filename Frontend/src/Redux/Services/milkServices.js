// storyService.js

import axios from "axios";
import { url2 } from "../Api/api";


const API_URL = `${url2}/milk`;


// Set up axios instance with baseURL
// const axiosInstance = axios.create({
// 	baseURL: API_URL,
// });

// const config = {
// 	headers: {
// 		Authorization: `Bearer ${token}`,
// 	},
// };

// get single user milk collection data
export const getmilkData = async (token,value) => {
	//console.log(token,value)
	try{

		const response = await axios.get(`${API_URL}/${value}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		//console.log(response)
	   return response.data;
	}
	catch(err)
	{
		//console.log(err);
	}
};

// Function to add new milk data on farmer account by id
export const postMilkData = async (value,token) => {
	//console.log(value)
	try {
		//console.log("milk data",token,value)
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const response = await axios.post(`${API_URL}/${value.farmerId}`, value, config);
		//console.log("created story",response.data)
		return response.data;
		
	} catch (error) {
		//console.log(error)
	}
};

export const updateMilkEntry = async (id, payload, token) =>{
	try {
		//console.log("milk data",id,token,payload)
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};

		const response = await axios.patch(`${API_URL}/${id}`, payload, config);
		//console.log("updated milk entry",response.data)
		return response.data;
		
	} catch (error) {
		//console.log(error)
	}

}

export const deleteMilkEntry = async (id, token) =>{
	try {
		//console.log("milk data",id,token)
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};

		const response = await axios.delete(`${API_URL}/${id}`, config);
		//console.log("updated milk entry",response.data)
		return id;
		
	} catch (error) {
		//console.log(error)
		return error;
	}

}





