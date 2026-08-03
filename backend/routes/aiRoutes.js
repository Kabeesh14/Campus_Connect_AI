const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  chatWithAi,
  analyzeSkillGap,
  analyzeResume,
  parseResumeFile,
  getChatHistory,
  deleteChatItem,
  clearChatHistory,
  getCareerRoadmap,
} = require('../controllers/aiController');
const { verifyToken, optionalVerifyToken } = require('../middleware/authMiddleware');

// Configure Multer for PDF, DOCX, and Image uploads with file validation
const uploadStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const mimeExtMap = {
    '.pdf': ['application/pdf'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.doc': ['application/msword', 'application/x-msword'],
    '.jpg': ['image/jpeg', 'image/jpg', 'image/pjpeg'],
    '.jpeg': ['image/jpeg', 'image/jpg', 'image/pjpeg'],
    '.png': ['image/png'],
  };

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = mimeExtMap[ext];

  if (allowedMimes && allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type or MIME mismatch (${ext} / ${file.mimetype}). PDF, DOCX, and Image (JPG, PNG) files are supported.`),
      false
    );
  }
};

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

// Public AI Routes (Optional JWT Token for personalization, never fails with 401)
router.post('/chat', optionalVerifyToken, chatWithAi);
router.post('/career-advisor/chat', optionalVerifyToken, chatWithAi);
router.post('/skill-gap', optionalVerifyToken, analyzeSkillGap);
router.get('/career-advisor/roadmap', optionalVerifyToken, getCareerRoadmap);

// Resume Analysis & Parsing Endpoints (Public AI, optional token)
router.post('/resume/analyze', upload.single('resume'), optionalVerifyToken, analyzeResume);
router.post('/resume/parse', upload.single('resume'), optionalVerifyToken, parseResumeFile);

// Protected User Chat History Endpoints (Requires valid JWT token)
router.get('/history/:toolType', verifyToken, getChatHistory);
router.delete('/history/item/:id', verifyToken, deleteChatItem);
router.delete('/history/clear/:toolType', verifyToken, clearChatHistory);

module.exports = router;
