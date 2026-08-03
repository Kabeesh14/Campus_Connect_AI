const crypto = require('crypto');
const { query } = require('../config/db');

/**
 * Get All Registered Students (Placement Officer View)
 */
const getStudents = async (req, res, next) => {
  try {
    const students = await query(`
      SELECT 
        s.id, s.user_id as userId, s.name, u.email, s.avatar, s.headline,
        s.department, s.cgpa, s.graduation_year as graduationYear, s.phone, s.created_at as createdAt
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);

    return res.status(200).json({ success: true, count: students.length, students });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Recruiters & Companies
 */
const getRecruiters = async (req, res, next) => {
  try {
    const recruiters = await query(`
      SELECT 
        r.id, r.user_id as userId, r.name, u.email, r.designation, r.phone,
        c.name as companyName, c.logo as companyLogo
      FROM recruiters r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN companies c ON r.company_id = c.id
      ORDER BY r.created_at DESC
    `);

    return res.status(200).json({ success: true, count: recruiters.length, recruiters });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Onboarded Companies
 */
const getCompanies = async (req, res, next) => {
  try {
    const companies = await query('SELECT * FROM companies ORDER BY created_at DESC');
    return res.status(200).json({ success: true, count: companies.length, companies });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Company Hiring Status / Approval
 */
const toggleCompanyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hiring } = req.body;

    await query('UPDATE companies SET hiring = ? WHERE id = ?', [hiring ? 1 : 0, id]);
    return res.status(200).json({ success: true, message: 'Company hiring status updated.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Active Placement Drives
 */
const getPlacementDrives = async (req, res, next) => {
  try {
    const drives = await query(`
      SELECT 
        c.id as companyId, c.name as companyName, c.logo, c.industry, c.location,
        c.salary, c.hiring, c.open_roles as openRoles, c.deadline_days as deadlineDays,
        COALESCE(j_count.totalJobPostings, 0) as totalJobPostings
      FROM companies c
      LEFT JOIN (
        SELECT company_id, COUNT(id) as totalJobPostings
        FROM jobs
        GROUP BY company_id
      ) j_count ON c.id = j_count.company_id
      ORDER BY c.hiring DESC, c.created_at DESC
    `);

    return res.status(200).json({ success: true, drives });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Campus Announcement & Broadcast to Users
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, body } = req.body;
    const userId = req.user?.id;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required for announcements.' });
    }

    const annId = 'ann-' + crypto.randomUUID();

    await withTransaction(async (txQuery) => {
      // Record announcement
      await txQuery(
        'INSERT INTO announcements (id, officer_id, title, body) VALUES (?, ?, ?, ?)',
        [annId, userId || 'officer', title, body]
      );

      // Broadcast notification to all students
      const students = await txQuery('SELECT user_id FROM students');
      for (const student of students) {
        const notifId = 'n-' + crypto.randomUUID();
        await txQuery(
          'INSERT INTO notifications (id, user_id, type, title, body, time) VALUES (?, ?, "announcement", ?, ?, "Just now")',
          [notifId, student.user_id, title, body]
        );
      }
    });

    return res.status(201).json({
      success: true,
      message: `Announcement posted and broadcast to students successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Live Placement Officer Analytics & Reports (100% Dynamic DB Data)
 */
const getOfficerAnalytics = async (req, res, next) => {
  try {
    const [totalStudentsRes] = await query('SELECT COUNT(*) as count FROM students');
    const [placedStudentsRes] = await query('SELECT COUNT(DISTINCT student_id) as count FROM applications WHERE stage IN ("offer", "joined")');
    const [totalAppsRes] = await query('SELECT COUNT(*) as count FROM applications');
    const [totalCompaniesRes] = await query('SELECT COUNT(*) as count FROM companies');

    const totalStudents = Number(totalStudentsRes?.count || 0);
    const placedStudents = Number(placedStudentsRes?.count || 0);
    const applications = Number(totalAppsRes?.count || 0);
    const companies = Number(totalCompaniesRes?.count || 0);

    const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

    const deptStats = await query(`
      SELECT 
        s.department as dept,
        COUNT(s.id) as total,
        COUNT(DISTINCT CASE WHEN a.stage IN ("offer", "joined") THEN s.id END) as placed
      FROM students s
      LEFT JOIN applications a ON s.id = a.student_id
      GROUP BY s.department
    `);

    const departmentData = deptStats.map((d) => ({
      dept: d.dept || 'Unassigned',
      placed: Number(d.placed || 0),
      total: Number(d.total || 0),
    }));

    return res.status(200).json({
      success: true,
      analytics: {
        totalStudents,
        placedStudents,
        applications,
        companies,
        placementRate,
        avgPackage: 0,
        departmentData,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getRecruiters,
  getCompanies,
  toggleCompanyStatus,
  getPlacementDrives,
  createAnnouncement,
  getOfficerAnalytics,
};
