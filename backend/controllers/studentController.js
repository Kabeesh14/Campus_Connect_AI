const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const pdfParseModule = require('pdf-parse');
const mammoth = require('mammoth');
const { query, withTransaction } = require('../config/db');
const { extractJobSkills } = require('../services/adzunaService');

const parsePdfBuffer = async (buffer) => {
  if (typeof pdfParseModule === 'function') {
    return await pdfParseModule(buffer);
  }
  if (pdfParseModule && typeof pdfParseModule.default === 'function') {
    return await pdfParseModule.default(buffer);
  }
  if (pdfParseModule && typeof pdfParseModule.pdfParse === 'function') {
    return await pdfParseModule.pdfParse(buffer);
  }
  if (typeof pdfParseModule.PDFParser === 'function') {
    const parser = new pdfParseModule.PDFParser();
    return await parser.parseBuffer(buffer);
  }
  return { text: buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ') };
};

const normalizeAvatarPath = (avatarStr) => {
  const fallback = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200';
  if (!avatarStr || typeof avatarStr !== 'string' || !avatarStr.trim()) {
    return fallback;
  }
  let clean = avatarStr.trim().replace(/\\/g, '/');
  if (clean.includes('/uploads/avatars/')) {
    const filename = clean.split('/uploads/avatars/').pop();
    return `/uploads/avatars/${filename}`;
  }
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  return clean.startsWith('/') ? clean : `/${clean}`;
};

const sanitizeName = (rawName, email) => {
  if (rawName && typeof rawName === 'string' && !rawName.startsWith('/uploads/') && !rawName.includes('.jpg') && !rawName.includes('.png')) {
    return rawName;
  }
  if (email && typeof email === 'string') {
    const prefix = email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return 'Student User';
};

const deleteUploadedFile = (relativePath) => {
  if (!relativePath || typeof relativePath !== 'string') return;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return;
  try {
    const clean = relativePath.trim().replace(/^[/\\]+/, '');
    const absPath = path.resolve(__dirname, '..', clean);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
  } catch (err) {
    console.error('[File Clean Up Error]', err.message);
  }
};

/**
 * Get Logged-in Student's Complete Profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch student info
    const students = await query('SELECT * FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const student = students[0];

    // Fetch related records
    const skills = await query('SELECT id, name, level, category FROM skills WHERE student_id = ? ORDER BY created_at ASC', [student.id]);
    const projects = await query('SELECT * FROM projects WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    const certifications = await query('SELECT * FROM certifications WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    const achievements = await query('SELECT * FROM achievements WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    const resumes = await query('SELECT id, file_name, file_path, file_size, mime_type, uploaded_at FROM resumes WHERE student_id = ? ORDER BY uploaded_at DESC LIMIT 1', [student.id]);

    const formattedProjects = projects.map((p) => {
      let parsedStack = [];
      if (Array.isArray(p.stack)) {
        parsedStack = p.stack;
      } else if (typeof p.stack === 'string') {
        try {
          const jsonParsed = JSON.parse(p.stack);
          parsedStack = Array.isArray(jsonParsed) ? jsonParsed : p.stack.split(',').map((s) => s.trim());
        } catch {
          parsedStack = p.stack.split(',').map((s) => s.trim());
        }
      }
      return {
        id: p.id,
        name: p.name,
        desc: p.desc || p.description || '',
        stack: parsedStack,
        link: p.link || p.github_url || p.live_demo_url || '',
        githubUrl: p.github_url || p.link || '',
        liveDemoUrl: p.live_demo_url || '',
        startDate: p.start_date || '',
        endDate: p.end_date || '',
        imageUrl: p.image_url || '',
        createdAt: p.created_at,
      };
    });

    const formattedCerts = certifications.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer || c.issuing_organization || '',
      year: c.year || c.issue_date || '',
      issueDate: c.issue_date || c.year || '',
      credentialId: c.credential_id || '',
      credentialUrl: c.credential_url || '',
      certificateFileUrl: c.certificate_file_url || '',
      createdAt: c.created_at,
    }));

    const formattedAchievements = achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description || '',
      organization: a.organization || '',
      achievementDate: a.achievement_date || '',
      url: a.url || '',
      proofUrl: a.proof_url || '',
      createdAt: a.created_at,
    }));

    // Calculate profile completion percentage (10 fields)
    let completedFields = 0;
    const totalFields = 10;
    if (student.name) completedFields++;
    if (student.headline) completedFields++;
    if (student.avatar) completedFields++;
    if (student.bio) completedFields++;
    if (student.department) completedFields++;
    if (skills.length > 0) completedFields++;
    if (formattedProjects.length > 0) completedFields++;
    if (formattedCerts.length > 0) completedFields++;
    if (formattedAchievements.length > 0) completedFields++;
    if (resumes.length > 0) completedFields++;
    const completion = Math.min(100, Math.round((completedFields / totalFields) * 100));

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          userId: student.user_id,
          name: sanitizeName(student.name, req.user.email),
          email: req.user.email,
          avatar: normalizeAvatarPath(student.avatar),
          headline: (student.headline && !student.headline.startsWith('/uploads/') && student.headline !== student.user_id) ? student.headline : 'Student',
          department: student.department || 'Computer Science & Engineering',
          cgpa: student.cgpa ? parseFloat(student.cgpa) : 8.0,
          graduationYear: student.graduation_year || 2026,
          bio: student.bio || '',
          phone: student.phone || '',
          completion,
        },
        skills,
        projects: formattedProjects,
        certifications: formattedCerts,
        achievements: formattedAchievements,
        resume: resumes[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Student Profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, headline, department, cgpa, graduationYear, bio, phone } = req.body;

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const studentId = students[0].id;

    await query(
      `UPDATE students SET 
        name = COALESCE(?, name),
        headline = COALESCE(?, headline),
        department = COALESCE(?, department),
        cgpa = COALESCE(?, cgpa),
        graduation_year = COALESCE(?, graduation_year),
        bio = COALESCE(?, bio),
        phone = COALESCE(?, phone)
      WHERE id = ?`,
      [name, headline, department, cgpa, graduationYear, bio, phone, studentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Student Profile Picture (Avatar)
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    if (req.user.role === 'recruiter') {
      await query('UPDATE recruiters SET avatar = ? WHERE user_id = ?', [avatarUrl, userId]);
    } else if (req.user.role === 'officer') {
      await query('UPDATE placement_officers SET avatar = ? WHERE user_id = ?', [avatarUrl, userId]);
    } else {
      await query('UPDATE students SET avatar = ? WHERE user_id = ?', [avatarUrl, userId]);
    }

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully.',
      avatar: avatarUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Skills CRUD
 */
const addSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, level = 70, category = 'Core' } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Skill name is required.' });
    }

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const studentId = students[0].id;

    const skillId = 'sk-' + crypto.randomUUID();
    await query('INSERT INTO skills (id, student_id, name, level, category) VALUES (?, ?, ?, ?, ?)', [
      skillId,
      studentId,
      name,
      level,
      category,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Skill added.',
      skill: { id: skillId, name, level, category },
    });
  } catch (error) {
    next(error);
  }
};

const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM skills WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Skill removed.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Projects API & CRUD
 */
const getProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const projects = await query('SELECT * FROM projects WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    const formatted = projects.map((p) => {
      let parsedStack = [];
      if (Array.isArray(p.stack)) {
        parsedStack = p.stack;
      } else if (typeof p.stack === 'string') {
        try {
          const jsonParsed = JSON.parse(p.stack);
          parsedStack = Array.isArray(jsonParsed) ? jsonParsed : p.stack.split(',').map((s) => s.trim());
        } catch {
          parsedStack = p.stack.split(',').map((s) => s.trim());
        }
      }
      return {
        id: p.id,
        name: p.name,
        desc: p.desc || p.description || '',
        stack: parsedStack,
        link: p.link || p.github_url || p.live_demo_url || '',
        githubUrl: p.github_url || p.link || '',
        liveDemoUrl: p.live_demo_url || '',
        startDate: p.start_date || '',
        endDate: p.end_date || '',
        imageUrl: p.image_url || '',
        createdAt: p.created_at,
      };
    });

    return res.status(200).json({ success: true, projects: formatted });
  } catch (error) {
    next(error);
  }
};

const addProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const name = (req.body.name || req.body.projectName || '').trim();
    const desc = (req.body.desc || req.body.description || '').trim();
    const stackRaw = req.body.stack || req.body.technologies || [];
    const githubUrl = (req.body.github_url || req.body.githubUrl || req.body.link || '').trim();
    const liveDemoUrl = (req.body.live_demo_url || req.body.liveDemoUrl || '').trim();
    const startDate = (req.body.start_date || req.body.startDate || '').trim();
    const endDate = (req.body.end_date || req.body.endDate || '').trim();

    if (!name) {
      return res.status(400).json({ success: false, message: 'Project Name is required.' });
    }
    if (!desc) {
      return res.status(400).json({ success: false, message: 'Project Description is required.' });
    }
    if (!stackRaw || (Array.isArray(stackRaw) && stackRaw.length === 0) || (typeof stackRaw === 'string' && !stackRaw.trim())) {
      return res.status(400).json({ success: false, message: 'Technologies / Skills are required.' });
    }

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    let stackArr = [];
    if (Array.isArray(stackRaw)) {
      stackArr = stackRaw;
    } else if (typeof stackRaw === 'string') {
      try {
        const parsed = JSON.parse(stackRaw);
        stackArr = Array.isArray(parsed) ? parsed : stackRaw.split(',').map((s) => s.trim());
      } catch {
        stackArr = stackRaw.split(',').map((s) => s.trim());
      }
    }
    const stackJson = JSON.stringify(stackArr);

    const imageUrl = req.file ? `/uploads/projects/${req.file.filename}` : '';
    const projectId = 'pr-' + crypto.randomUUID();

    await query(
      `INSERT INTO projects 
        (id, student_id, name, \`desc\`, stack, link, github_url, live_demo_url, start_date, end_date, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        studentId,
        name,
        desc,
        stackJson,
        githubUrl || liveDemoUrl,
        githubUrl,
        liveDemoUrl,
        startDate,
        endDate,
        imageUrl,
      ]
    );

    const createdProject = {
      id: projectId,
      studentId,
      name,
      desc,
      stack: stackArr,
      link: githubUrl || liveDemoUrl,
      githubUrl,
      liveDemoUrl,
      startDate,
      endDate,
      imageUrl,
    };

    return res.status(201).json({
      success: true,
      message: 'Project added successfully.',
      project: createdProject,
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const existing = await query('SELECT * FROM projects WHERE id = ? AND student_id = ?', [id, studentId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied.' });
    }

    const prev = existing[0];
    const name = (req.body.name || req.body.projectName || prev.name).trim();
    const desc = (req.body.desc || req.body.description || prev.desc || prev.description || '').trim();
    const stackRaw = req.body.stack || req.body.technologies || prev.stack;
    const githubUrl = (req.body.github_url !== undefined ? req.body.github_url : (req.body.githubUrl !== undefined ? req.body.githubUrl : prev.github_url || prev.link || '')).trim();
    const liveDemoUrl = (req.body.live_demo_url !== undefined ? req.body.live_demo_url : (req.body.liveDemoUrl !== undefined ? req.body.liveDemoUrl : prev.live_demo_url || '')).trim();
    const startDate = (req.body.start_date !== undefined ? req.body.start_date : (req.body.startDate !== undefined ? req.body.startDate : prev.start_date || '')).trim();
    const endDate = (req.body.end_date !== undefined ? req.body.end_date : (req.body.endDate !== undefined ? req.body.endDate : prev.end_date || '')).trim();

    if (!name) return res.status(400).json({ success: false, message: 'Project Name is required.' });
    if (!desc) return res.status(400).json({ success: false, message: 'Project Description is required.' });

    let stackArr = [];
    if (Array.isArray(stackRaw)) {
      stackArr = stackRaw;
    } else if (typeof stackRaw === 'string') {
      try {
        const parsed = JSON.parse(stackRaw);
        stackArr = Array.isArray(parsed) ? parsed : stackRaw.split(',').map((s) => s.trim());
      } catch {
        stackArr = stackRaw.split(',').map((s) => s.trim());
      }
    }
    const stackJson = JSON.stringify(stackArr);

    let imageUrl = prev.image_url || '';
    if (req.file) {
      imageUrl = `/uploads/projects/${req.file.filename}`;
      if (prev.image_url) {
        deleteUploadedFile(prev.image_url);
      }
    }

    await query(
      `UPDATE projects SET 
        name = ?, 
        \`desc\` = ?, 
        stack = ?, 
        github_url = ?, 
        live_demo_url = ?, 
        start_date = ?, 
        end_date = ?, 
        image_url = ?,
        link = ?
       WHERE id = ? AND student_id = ?`,
      [
        name,
        desc,
        stackJson,
        githubUrl,
        liveDemoUrl,
        startDate,
        endDate,
        imageUrl,
        githubUrl || liveDemoUrl,
        id,
        studentId,
      ]
    );

    const updatedProject = {
      id,
      studentId,
      name,
      desc,
      stack: stackArr,
      link: githubUrl || liveDemoUrl,
      githubUrl,
      liveDemoUrl,
      startDate,
      endDate,
      imageUrl,
    };

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const existing = await query('SELECT * FROM projects WHERE id = ? AND student_id = ?', [id, studentId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied.' });
    }

    if (existing[0].image_url) {
      deleteUploadedFile(existing[0].image_url);
    }

    await query('DELETE FROM projects WHERE id = ? AND student_id = ?', [id, studentId]);
    return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Certifications API & CRUD
 */
const getCertifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const certifications = await query('SELECT * FROM certifications WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    const formatted = certifications.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer || c.issuing_organization || '',
      year: c.year || c.issue_date || '',
      issueDate: c.issue_date || c.year || '',
      credentialId: c.credential_id || '',
      credentialUrl: c.credential_url || '',
      certificateFileUrl: c.certificate_file_url || '',
      createdAt: c.created_at,
    }));

    return res.status(200).json({ success: true, certifications: formatted });
  } catch (error) {
    next(error);
  }
};

const addCertification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const name = (req.body.name || req.body.certificationName || '').trim();
    const issuer = (req.body.issuer || req.body.issuingOrganization || '').trim();
    const issueDate = (req.body.issue_date || req.body.issueDate || req.body.year || '').trim();
    const credentialId = (req.body.credential_id || req.body.credentialId || '').trim();
    const credentialUrl = (req.body.credential_url || req.body.credentialUrl || '').trim();

    if (!name) {
      return res.status(400).json({ success: false, message: 'Certification Name is required.' });
    }
    if (!issuer) {
      return res.status(400).json({ success: false, message: 'Issuing Organization is required.' });
    }

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const certFileUrl = req.file ? `/uploads/certifications/${req.file.filename}` : '';
    const certId = 'ct-' + crypto.randomUUID();

    await query(
      `INSERT INTO certifications 
        (id, student_id, name, issuer, year, issue_date, credential_id, credential_url, certificate_file_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        certId,
        studentId,
        name,
        issuer,
        issueDate,
        issueDate,
        credentialId,
        credentialUrl,
        certFileUrl,
      ]
    );

    const createdCert = {
      id: certId,
      studentId,
      name,
      issuer,
      year: issueDate,
      issueDate,
      credentialId,
      credentialUrl,
      certificateFileUrl: certFileUrl,
    };

    return res.status(201).json({
      success: true,
      message: 'Certification added successfully.',
      certification: createdCert,
    });
  } catch (error) {
    next(error);
  }
};

const updateCertification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const existing = await query('SELECT * FROM certifications WHERE id = ? AND student_id = ?', [id, studentId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Certification not found or access denied.' });
    }

    const prev = existing[0];
    const name = (req.body.name || req.body.certificationName || prev.name).trim();
    const issuer = (req.body.issuer || req.body.issuingOrganization || prev.issuer).trim();
    const issueDate = (req.body.issue_date !== undefined ? req.body.issue_date : (req.body.issueDate !== undefined ? req.body.issueDate : prev.issue_date || prev.year || '')).trim();
    const credentialId = (req.body.credential_id !== undefined ? req.body.credential_id : (req.body.credentialId !== undefined ? req.body.credentialId : prev.credential_id || '')).trim();
    const credentialUrl = (req.body.credential_url !== undefined ? req.body.credential_url : (req.body.credentialUrl !== undefined ? req.body.credentialUrl : prev.credential_url || '')).trim();

    if (!name) return res.status(400).json({ success: false, message: 'Certification Name is required.' });
    if (!issuer) return res.status(400).json({ success: false, message: 'Issuing Organization is required.' });

    let certFileUrl = prev.certificate_file_url || '';
    if (req.file) {
      certFileUrl = `/uploads/certifications/${req.file.filename}`;
      if (prev.certificate_file_url) {
        deleteUploadedFile(prev.certificate_file_url);
      }
    }

    await query(
      `UPDATE certifications SET 
        name = ?, 
        issuer = ?, 
        year = ?, 
        issue_date = ?, 
        credential_id = ?, 
        credential_url = ?, 
        certificate_file_url = ? 
       WHERE id = ? AND student_id = ?`,
      [
        name,
        issuer,
        issueDate,
        issueDate,
        credentialId,
        credentialUrl,
        certFileUrl,
        id,
        studentId,
      ]
    );

    const updatedCert = {
      id,
      studentId,
      name,
      issuer,
      year: issueDate,
      issueDate,
      credentialId,
      credentialUrl,
      certificateFileUrl: certFileUrl,
    };

    return res.status(200).json({
      success: true,
      message: 'Certification updated successfully.',
      certification: updatedCert,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCertification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const existing = await query('SELECT * FROM certifications WHERE id = ? AND student_id = ?', [id, studentId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Certification not found or access denied.' });
    }

    if (existing[0].certificate_file_url) {
      deleteUploadedFile(existing[0].certificate_file_url);
    }

    await query('DELETE FROM certifications WHERE id = ? AND student_id = ?', [id, studentId]);
    return res.status(200).json({ success: true, message: 'Certification deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Achievements API & CRUD
 */
const getAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const achievements = await query('SELECT * FROM achievements WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    const formatted = achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description || '',
      organization: a.organization || '',
      achievementDate: a.achievement_date || '',
      url: a.url || '',
      proofUrl: a.proof_url || '',
      createdAt: a.created_at,
    }));

    return res.status(200).json({ success: true, achievements: formatted });
  } catch (error) {
    next(error);
  }
};

const addAchievement = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const title = (req.body.title || req.body.achievementTitle || '').trim();
    const description = (req.body.description || req.body.desc || '').trim();
    const organization = (req.body.organization || req.body.event || '').trim();
    const achievementDate = (req.body.achievement_date || req.body.achievementDate || req.body.date || '').trim();
    const url = (req.body.url || '').trim();

    if (!title) {
      return res.status(400).json({ success: false, message: 'Achievement Title is required.' });
    }

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const proofUrl = req.file ? `/uploads/achievements/${req.file.filename}` : '';
    const achievementId = 'ach-' + crypto.randomUUID();

    await query(
      `INSERT INTO achievements 
        (id, student_id, title, description, organization, achievement_date, url, proof_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [achievementId, studentId, title, description, organization, achievementDate, url, proofUrl]
    );

    const newAchievement = {
      id: achievementId,
      studentId,
      title,
      description,
      organization,
      achievementDate,
      url,
      proofUrl,
    };

    return res.status(201).json({
      success: true,
      message: 'Achievement added successfully.',
      achievement: newAchievement,
    });
  } catch (error) {
    next(error);
  }
};

const updateAchievement = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const title = (req.body.title || req.body.achievementTitle || '').trim();
    const description = (req.body.description || req.body.desc || '').trim();
    const organization = (req.body.organization || req.body.event || '').trim();
    const achievementDate = (req.body.achievement_date || req.body.achievementDate || req.body.date || '').trim();
    const url = (req.body.url || '').trim();

    if (!title) {
      return res.status(400).json({ success: false, message: 'Achievement Title is required.' });
    }

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const existing = await query('SELECT * FROM achievements WHERE id = ? AND student_id = ?', [id, studentId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Achievement not found or access denied.' });
    }

    const prev = existing[0];
    let proofUrl = prev.proof_url || '';
    if (req.file) {
      proofUrl = `/uploads/achievements/${req.file.filename}`;
      if (prev.proof_url) {
        deleteUploadedFile(prev.proof_url);
      }
    }

    await query(
      `UPDATE achievements SET 
        title = ?, 
        description = ?, 
        organization = ?, 
        achievement_date = ?, 
        url = ?, 
        proof_url = ? 
       WHERE id = ? AND student_id = ?`,
      [title, description, organization, achievementDate, url, proofUrl, id, studentId]
    );

    const updatedAchievement = {
      id,
      studentId,
      title,
      description,
      organization,
      achievementDate,
      url,
      proofUrl,
    };

    return res.status(200).json({
      success: true,
      message: 'Achievement updated successfully.',
      achievement: updatedAchievement,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAchievement = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const studentId = students[0].id;

    const existing = await query('SELECT * FROM achievements WHERE id = ? AND student_id = ?', [id, studentId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Achievement not found or access denied.' });
    }

    if (existing[0].proof_url) {
      deleteUploadedFile(existing[0].proof_url);
    }

    await query('DELETE FROM achievements WHERE id = ? AND student_id = ?', [id, studentId]);
    return res.status(200).json({ success: true, message: 'Achievement deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Resume Upload & Download
 */
const uploadStudentResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a PDF or Word document to upload.' });
    }

    const userId = req.user.id;
    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const studentId = students[0].id;

    const resumeId = 'rs-' + crypto.randomUUID();
    const filePath = `/uploads/resumes/${req.file.filename}`;
    const absoluteFilePath = path.resolve(__dirname, '..', 'uploads', 'resumes', req.file.filename);

    let extractedText = '';

    try {
      const dataBuffer = fs.readFileSync(absoluteFilePath);
      const filenameLower = (req.file.originalname || '').toLowerCase();
      const mimeTypeLower = (req.file.mimetype || '').toLowerCase();

      if (mimeTypeLower.includes('pdf') || filenameLower.endsWith('.pdf')) {
        const parsedPdf = await parsePdfBuffer(dataBuffer);
        extractedText = (parsedPdf.text || '').trim();
      } else if (mimeTypeLower.includes('word') || mimeTypeLower.includes('document') || filenameLower.endsWith('.docx') || filenameLower.endsWith('.doc')) {
        const parsedDocx = await mammoth.extractRawText({ buffer: dataBuffer });
        extractedText = (parsedDocx.value || '').trim();
      } else {
        extractedText = dataBuffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
      }
    } catch (parseErr) {
      console.error('[Resume Parsing Error]', parseErr);
      return res.status(422).json({
        success: false,
        message: `Failed to parse resume document: ${parseErr.message}. Please ensure the file is not encrypted or corrupted.`,
      });
    }

    if (!extractedText || extractedText.length < 10) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract readable text from the uploaded file. Please ensure it contains selectable text and is not a scanned image PDF.',
      });
    }

    const normalizedText = extractedText.replace(/\s+/g, ' ').trim();
    const extractedSkills = extractJobSkills('', normalizedText);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[RESUME PARSE SUCCESS]', {
        studentId,
        resumeId,
        textLength: normalizedText.length,
        extractedSkillsCount: extractedSkills.length,
        extractedSkills,
      });
    }

    // Locate previous resume files and safely delete them from server disk
    try {
      const existingResumes = await query('SELECT file_path FROM resumes WHERE student_id = ?', [studentId]);
      for (const oldResume of existingResumes) {
        if (oldResume.file_path) {
          const relativePath = oldResume.file_path.replace(/^[/\\]+/, '');
          const absoluteOldPath = path.resolve(__dirname, '..', relativePath);
          if (fs.existsSync(absoluteOldPath) && absoluteOldPath !== absoluteFilePath) {
            fs.unlinkSync(absoluteOldPath);
            console.log(`[Resume Clean Up] Successfully unlinked previous resume file: ${absoluteOldPath}`);
          }
        }
      }
    } catch (cleanErr) {
      console.error('[Resume Clean Up Warning] Failed to delete previous resume file from disk:', cleanErr.message);
    }

    // Delete existing database record and insert new resume inside transaction
    await withTransaction(async (txQuery) => {
      await txQuery('DELETE FROM resumes WHERE student_id = ?', [studentId]);
      await txQuery(
        'INSERT INTO resumes (id, student_id, file_name, file_path, file_size, mime_type, parsed_content) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [resumeId, studentId, req.file.originalname, filePath, req.file.size, req.file.mimetype, normalizedText]
      );
    });

    // Also persist extracted resume skills into student's skills table so manual skill list gets enriched
    for (const skillName of extractedSkills) {
      try {
        const existingSkill = await query('SELECT id FROM skills WHERE student_id = ? AND LOWER(name) = ?', [studentId, skillName.toLowerCase()]);
        if (existingSkill.length === 0) {
          const skillId = 'sk-' + crypto.randomUUID();
          await query('INSERT INTO skills (id, student_id, name, level) VALUES (?, ?, ?, ?)', [skillId, studentId, skillName, 'Intermediate']);
        }
      } catch (skErr) {
        // Continue
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully.',
      resume: {
        id: resumeId,
        fileName: req.file.originalname,
        filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        parsedTextLength: normalizedText.length,
        extractedSkillsCount: extractedSkills.length,
        extractedSkills,
      },
    });
  } catch (error) {
    next(error);
  }
};

const downloadResume = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const studentId = students[0].id;

    const resumes = await query('SELECT * FROM resumes WHERE student_id = ? ORDER BY uploaded_at DESC LIMIT 1', [studentId]);
    if (resumes.length === 0) {
      return res.status(404).json({ success: false, message: 'No resume uploaded yet.' });
    }

    const resume = resumes[0];
    const normalizedRelative = path.normalize(resume.file_path || '').replace(/^[/\\]+/, '');
    const absolutePath = path.resolve(__dirname, '..', normalizedRelative);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Resume file not found on server.' });
    }

    return res.download(absolutePath, resume.file_name);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
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
  getAchievements,
  addAchievement,
  updateAchievement,
  deleteAchievement,
  uploadStudentResume,
  downloadResume,
};
