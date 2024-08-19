const mongoose = require("mongoose");

// milk provider model
const userSchema = new mongoose.Schema(
	{
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Admin",
			required: true,
		},
		
		name: {
			type: String,
			required: [true, "Please add first and last name"],
		},
		gender: {
			type: String,
			enum: ["Male", "Female", "Other"],
			default: "Male",
		},
		village: {
			type: String,
			required: [true, "Please add village name"],
		},
		mobile: {
			type: String,
			required: true,
			message: "mobile number should be required.",
			maxlength: "10",
			minlength: "10",
			index: true,
			unique: true,
		},
		status: {
			type: String,
			enum: ["active", "pause"],
			default: "active",
		},
		role: {
			type: String,
			enum: ["Farmer", "Admin"],
			default: "Farmer",
		},
		email: {
			type: String,
			required: [true, "Please add email ID"],
			default: "milkify@gmail.com",
		},
		
		milks: [],

	},
	{
		timestamps: true,
	}
);

const farmerModel = mongoose.model("Farmer", userSchema);

module.exports = {
	farmerModel,
};
