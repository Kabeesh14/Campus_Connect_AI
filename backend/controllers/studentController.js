const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { query, withTransaction } = require('../config/db');

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
    const projects = await query('SELECT id, name, desc, stack, link FROM projects WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    const certifications = await query('SELECT id, name, issuer, year FROM certifications WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    const resumes = await query('SELECT id, file_name, file_path, file_size, mime_type, uploaded_at FROM resumes WHERE student_id = ? ORDER BY uploaded_at DESC LIMIT 1', [student.id]);

    // Parse JSON stacks if needed
    const formattedProjects = projects.map((p) => ({
      ...p,
      stack: typeof p.stack === 'string' ? JSON.parse(p.stack) : p.stack || [],
    }));

    // Calculate profile completion percentage
    let completedFields = 0;
    const totalFields = 8;
    if (student.name) completedFields++;
    if (student.department) completedFields++;
    if (student.cgpa) completedFields++;
    if (student.graduation_year) completedFields++;
    if (student.avatar) completedFields++;
    if (skills.length > 0) completedFields++;
    if (formattedProjects.length > 0) completedFields++;
    if (resumes.length > 0) completedFields++;
    const completion = Math.min(100, Math.round((completedFields / totalFields) * 100));

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          userId: student.user_id,
          name: student.name,
          email: req.user.email,
          avatar: student.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
          headline: student.headline || 'Student',
          department: student.department || 'Computer Science & Engineering',
          cgpa: student.cgpa ? parseFloat(student.cgpa) : 8.0,
          graduationYear: student.graduation_year || 2026,
          bio: student.bio || '',
          phone: student.phone || '',
          completion,
        },
        skills,
        projects: formattedProjects,
        certifications,
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
 * Projects CRUD
 */
const addProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, desc, stack = [], link = '' } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required.' });
    }

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const studentId = students[0].id;

    const projectId = 'pr-' + crypto.randomUUID();
    const stackJson = JSON.stringify(stack);

    await query('INSERT INTO projects (id, student_id, name, `desc`, stack, link) VALUES (?, ?, ?, ?, ?, ?)', [
      projectId,
      studentId,
      name,
      desc,
      stackJson,
      link,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Project added.',
      project: { id: projectId, name, desc, stack, link },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM projects WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Certifications CRUD
 */
const addCertification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, issuer, year } = req.body;

    if (!name || !issuer || !year) {
      return res.status(400).json({ success: false, message: 'Certification name, issuer, and year are required.' });
    }

    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    const studentId = students[0].id;

    const certId = 'ct-' + crypto.randomUUID();
    await query('INSERT INTO certifications (id, student_id, name, issuer, year) VALUES (?, ?, ?, ?, ?)', [
      certId,
      studentId,
      name,
      issuer,
      year,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Certification added.',
      certification: { id: certId, name, issuer, year },
    });
  } catch (error) {
    next(error);
  }
};

const deleteCertification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM certifications WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Certification deleted.' });
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

    // Locate previous resume files and safely delete them from server disk
    try {
      const existingResumes = await query('SELECT file_path FROM resumes WHERE student_id = ?', [studentId]);
      for (const oldResume of existingResumes) {
        if (oldResume.file_path) {
          const relativePath = oldResume.file_path.replace(/^[/\\]+/, '');
          const absoluteOldPath = path.resolve(__dirname, '..', relativePath);
          if (fs.existsSync(absoluteOldPath)) {
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
        'INSERT INTO resumes (id, student_id, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
        [resumeId, studentId, req.file.originalname, filePath, req.file.size, req.file.mimetype]
      );
    });

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully.',
      resume: {
        id: resumeId,
        fileName: req.file.originalname,
        filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
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
  addProject,
  deleteProject,
  addCertification,
  deleteCertification,
  uploadStudentResume,
  downloadResume,
};
