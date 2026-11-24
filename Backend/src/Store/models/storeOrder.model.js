const mongoose = require("mongoose");

const storeOrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StoreProduct",
    required: true,
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  packageSize: { type: String, default: "" },
  image: { type: String, default: "" },
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 },
  totalItemAmount: { type: Number, required: true },
});

const storeOrderSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreCustomer",
      default: null,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderChannel: {
      type: String,
      enum: ["online", "pos_counter"],
      default: "online",
      index: true,
    },
    items: [storeOrderItemSchema],
    itemCount: {
      type: Number,
      default: 1,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    voucherCode: {
      type: String,
      default: "",
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    fulfillmentType: {
      type: String,
      enum: ["village_delivery", "counter_pickup"],
      default: "village_delivery",
    },
    deliveryAddress: {
      recipientName: String,
      recipientPhone: String,
      village: String,
      landmark: String,
      fullAddress: String,
      pincode: String,
      latitude: Number,
      longitude: Number,
      distanceKm: Number,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay", "cash_counter", "farmer_milk_bill", "upi_qr"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"],
      default: "placed",
      index: true,
    },
    statusHistory: [
      {
        status: String,
        updatedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    assignedRunner: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    customerNotes: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

storeOrderSchema.index({ adminId: 1, createdAt: -1 });
storeOrderSchema.index({ customerId: 1, createdAt: -1 });

const StoreOrderModel = mongoose.models.StoreOrder || mongoose.model("StoreOrder", storeOrderSchema);

module.exports = StoreOrderModel;
