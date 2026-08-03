const express = require('express');
const router = express.Router();
const { getPlacementAnalytics } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/placement', getPlacementAnalytics);

module.exports = router;
