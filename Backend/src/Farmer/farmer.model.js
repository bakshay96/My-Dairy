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
		memberId: {
			type: String,
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

// Indexes for optimized queries
userSchema.index({ adminId: 1, mobile: 1 }, { unique: true });
userSchema.index({ adminId: 1, name: 1 });
userSchema.index({ adminId: 1, status: 1 });
userSchema.index({ createdAt: -1 });

const farmerModel = mongoose.model("Farmer", userSchema);

module.exports = {
	farmerModel,
};
