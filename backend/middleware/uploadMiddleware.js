const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(uploadDir, 'avatars');
const resumesDir = path.join(uploadDir, 'resumes');
const logosDir = path.join(uploadDir, 'logos');

[uploadDir, avatarsDir, resumesDir, logosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage Engine for Avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Storage Engine for Resumes
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `resume-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Storage Engine for Company Logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const imageFilter = (req, file, cb) => {
  const allowedExts = /^\.(jpeg|jpg|png|gif|webp)$/i;
  const allowedMimes = /^image\/(jpeg|jpg|png|gif|webp)$/i;
  const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedMimes.test(file.mimetype.toLowerCase());
  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image files (jpeg, jpg, png, gif, webp) with matching MIME types are allowed!'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const docMap = {
    '.pdf': ['application/pdf'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.doc': ['application/msword', 'application/x-msword'],
  };
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = docMap[ext];
  if (allowed && allowed.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only valid PDF or Word documents (pdf, doc, docx) with matching MIME types are allowed!'), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter,
});

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: documentFilter,
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

module.exports = {
  uploadAvatar,
  uploadResume,
  uploadLogo,
};
