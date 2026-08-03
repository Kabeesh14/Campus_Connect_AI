const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  applyToJob,
  withdrawApplication,
  getUserApplications,
} = require('../controllers/jobController');

const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getJobs);
router.get('/applications', getUserApplications);
router.get('/:id', getJobById);
router.post('/:id/apply', applyToJob);
router.delete('/applications/:id', withdrawApplication);

module.exports = router;
