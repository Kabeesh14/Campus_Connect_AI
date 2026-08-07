const express = require('express');
const router = express.Router();
const {
  getJobs,
  searchJobs,
  getJobById,
  getCompanyJobs,
  getCompanies,
  getSavedJobs,
  saveJob,
  removeSavedJob,
} = require('../controllers/jobsController');

const {
  applyToJob,
  withdrawApplication,
  getUserApplications,
} = require('../controllers/jobController');

const { verifyToken } = require('../middleware/authMiddleware');

// Public / Protected Jobs API Routes
router.get('/', verifyToken, getJobs);
router.get('/search', verifyToken, searchJobs);
router.get('/companies', verifyToken, getCompanies);
router.get('/company/:company', verifyToken, getCompanyJobs);
router.get('/applications', verifyToken, getUserApplications);
router.get('/saved', verifyToken, getSavedJobs);
router.post('/save', verifyToken, saveJob);
router.delete('/save/:id', verifyToken, removeSavedJob);
router.get('/:id', verifyToken, getJobById);
router.post('/:id/apply', verifyToken, applyToJob);
router.delete('/applications/:id', verifyToken, withdrawApplication);

module.exports = router;
