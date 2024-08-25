const express = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const { createOrUpdateRateSetting, getRateSettings, deleteRateCollection } = require('./rateSetting.controller');

const rateRouter = express.Router();

rateRouter.post('/', authMiddleware, createOrUpdateRateSetting);
rateRouter.get('/', authMiddleware, getRateSettings);
rateRouter.delete('/:id',authMiddleware,deleteRateCollection);
module.exports = rateRouter;
