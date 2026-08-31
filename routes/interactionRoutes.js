const express = require('express');
const router = express.Router({ mergeParams: true });
const { getInteractions, createInteraction } = require('../controllers/interactionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:customerId').get(protect, getInteractions).post(protect, createInteraction);

module.exports = router;
