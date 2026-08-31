const express = require('express');
const router = express.Router();
const {
    getReports,
    createReport,
    updateReport,
    generateInsights,
    getInsights
} = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getReports)
    .post(protect, createReport);

router.route('/:id')
    .put(protect, updateReport);

router.route('/insights')
    .get(protect, admin, getInsights);

router.route('/insights/generate')
    .post(protect, admin, generateInsights);

module.exports = router;
