const profileController = require("./storeProfile.controller");
const productController = require("./storeProduct.controller");
const orderController = require("./storeOrder.controller");
const masterController = require("./storeMaster.controller");
const couponController = require("./storeCoupon.controller");

module.exports = {
  ...profileController,
  ...productController,
  ...orderController,
  ...masterController,
  ...couponController,
};
