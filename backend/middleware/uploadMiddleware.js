const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(uploadDir, 'avatars');
const resumesDir = path.join(uploadDir, 'resumes');
const logosDir = path.join(uploadDir, 'logos');
const projectsDir = path.join(uploadDir, 'projects');
const certificationsDir = path.join(uploadDir, 'certifications');

[uploadDir, avatarsDir, resumesDir, logosDir, projectsDir, certificationsDir].forEach((dir) => {
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

// Storage Engine for Project Images
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, projectsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `project-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Storage Engine for Certificates
const certStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certificationsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `cert-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const imageFilter = (req, file, cb) => {
  const allowedExts = /^\.(jpeg|jpg|png|gif|webp|svg|avif|heic)$/i;
  const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const isImageMime = file.mimetype && file.mimetype.toLowerCase().startsWith('image/');
  if (extValid || isImageMime) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image files (jpeg, jpg, png, gif, webp, svg) are allowed!'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedExts = /^\.(pdf|docx|doc)$/i;
  const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const isDocMime = file.mimetype && (
    file.mimetype.includes('pdf') ||
    file.mimetype.includes('word') ||
    file.mimetype.includes('officedocument') ||
    file.mimetype.includes('octet-stream')
  );
  if (extValid || isDocMime) {
    cb(null, true);
  } else {
    cb(new Error('Only valid PDF or Word documents (pdf, doc, docx) are allowed!'), false);
  }
};

const certFilter = (req, file, cb) => {
  const allowedExts = /^\.(pdf|docx|doc|jpeg|jpg|png|webp|gif|svg)$/i;
  const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const isDocOrImgMime = file.mimetype && (
    file.mimetype.toLowerCase().startsWith('image/') ||
    file.mimetype.includes('pdf') ||
    file.mimetype.includes('word') ||
    file.mimetype.includes('officedocument') ||
    file.mimetype.includes('octet-stream')
  );
  if (extValid || isDocOrImgMime) {
    cb(null, true);
  } else {
    cb(new Error('Only valid PDF, Word, or image files (pdf, doc, docx, jpg, png, webp) are allowed for certificates!'), false);
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

const uploadProjectImage = multer({
  storage: projectStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter,
});

const uploadCertificateFile = multer({
  storage: certStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: certFilter,
});

module.exports = {
  uploadAvatar,
  uploadResume,
  uploadLogo,
  uploadProjectImage,
  uploadCertificateFile,
};
