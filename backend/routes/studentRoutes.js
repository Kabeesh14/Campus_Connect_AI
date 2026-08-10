const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadAvatar: uploadAvatarController,
  addSkill,
  deleteSkill,
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getCertifications,
  addCertification,
  updateCertification,
  deleteCertification,
  uploadStudentResume,
  downloadResume,
} = require('../controllers/studentController');

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadAvatar, uploadResume, uploadProjectImage, uploadCertificateFile } = require('../middleware/uploadMiddleware');

// All routes require authentication and student/officer role access
router.use(verifyToken);
router.use(authorizeRoles('student', 'officer'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', uploadAvatar.single('avatar'), uploadAvatarController);

// Skills
router.post('/skills', addSkill);
router.delete('/skills/:id', deleteSkill);

// Projects
router.get('/projects', getProjects);
router.post('/projects', uploadProjectImage.single('image'), addProject);
router.put('/projects/:id', uploadProjectImage.single('image'), updateProject);
router.delete('/projects/:id', deleteProject);

// Certifications
router.get('/certifications', getCertifications);
router.post('/certifications', uploadCertificateFile.single('file'), addCertification);
router.put('/certifications/:id', uploadCertificateFile.single('file'), updateCertification);
router.delete('/certifications/:id', deleteCertification);

// Resume Upload & Download
router.post('/resume', uploadResume.single('resume'), uploadStudentResume);
router.get('/resume/download', downloadResume);

module.exports = router;
