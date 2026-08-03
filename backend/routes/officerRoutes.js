const express = require('express');
const router = express.Router();
const {
  getStudents,
  getRecruiters,
  getCompanies,
  toggleCompanyStatus,
  getPlacementDrives,
  createAnnouncement,
  getOfficerAnalytics,
} = require('../controllers/officerController');

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// All officer routes require verification and officer role
router.use(verifyToken);
router.use(authorizeRoles('officer'));

router.get('/students', getStudents);
router.get('/recruiters', getRecruiters);
router.get('/companies', getCompanies);
router.patch('/companies/:id/status', toggleCompanyStatus);
router.get('/drives', getPlacementDrives);
router.post('/announcements', createAnnouncement);
router.get('/analytics', getOfficerAnalytics);

module.exports = router;
