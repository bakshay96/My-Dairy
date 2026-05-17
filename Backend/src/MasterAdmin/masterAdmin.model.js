const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const master_adminSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: true },
    lastName:   { type: String, required: true },
    mobile:     { type: String, required: true, maxlength: "10", minlength: "10", index: true },
    email:      { type: String, required: true, unique: true },
    username:   { type: String, required: true, unique: true },
    password:   { type: String, required: true, minlength: "4" },
    key:        { type: String }, // plaintext backup (for dev reference)
    role:       { type: String, default: "master_admin", enum: ["master_admin"] },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save if modified
master_adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password && !this.password.startsWith("$2")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

master_adminSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

const MasterAdminModel = mongoose.model("master", master_adminSchema);

module.exports = { MasterAdminModel };
