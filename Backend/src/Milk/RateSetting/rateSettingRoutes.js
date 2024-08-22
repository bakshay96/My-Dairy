const express = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { createOrUpdateRateSetting, getRateSettings } = require('./rateSetting.controller');

const rateRouter = express.Router();

rateRouter.post('/', authMiddleware, createOrUpdateRateSetting);
rateRouter.get('/', authMiddleware, getRateSettings);

module.exports = rateRouter;
