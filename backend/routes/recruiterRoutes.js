const express = require('express');
const router = express.Router();
const {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  postJob,
  updateJob,
  deleteJob,
  getApplicants,
  updateApplicantStatus,
  scheduleInterview,
} = require('../controllers/recruiterController');

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadLogo } = require('../middleware/uploadMiddleware');

// All recruiter routes require verification and recruiter or officer role
router.use(verifyToken);
router.use(authorizeRoles('recruiter', 'officer'));

router.get('/company', getCompanyProfile);
router.put('/company', updateCompanyProfile);
router.post('/company/logo', uploadLogo.single('logo'), uploadCompanyLogo);

// Job Posting CRUD
router.post('/jobs', postJob);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// Applicant Pipeline
router.get('/applicants', getApplicants);
router.patch('/applicants/:id/status', updateApplicantStatus);

// Interview Scheduling
router.post('/interviews', scheduleInterview);

module.exports = router;
