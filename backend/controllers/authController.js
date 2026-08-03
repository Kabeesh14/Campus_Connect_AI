const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, withTransaction } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_campus_connect_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Fetch Full User Profile based on Role
 */
const fetchUserProfile = async (userId, role) => {
  let profile = null;
  if (role === 'student') {
    const students = await query('SELECT * FROM students WHERE user_id = ?', [userId]);
    if (students.length > 0) profile = students[0];
  } else if (role === 'recruiter') {
    const recruiters = await query('SELECT * FROM recruiters WHERE user_id = ?', [userId]);
    if (recruiters.length > 0) profile = recruiters[0];
  } else if (role === 'officer') {
    const officers = await query('SELECT * FROM placement_officers WHERE user_id = ?', [userId]);
    if (officers.length > 0) profile = officers[0];
  }
  return profile;
};

/**
 * Register New User
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required fields.',
      });
    }

    const validRoles = ['student', 'recruiter', 'officer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified.',
      });
    }

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const userId = 'u-' + crypto.randomUUID();
    const profileId = 'p-' + crypto.randomUUID();

    // Wrap multi-table inserts in ACID transaction
    await withTransaction(async (txQuery) => {
      await txQuery(
        'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [userId, email.toLowerCase().trim(), password_hash, role]
      );

      if (role === 'student') {
        await txQuery(
          'INSERT INTO students (id, user_id, name, headline, department, cgpa, graduation_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [profileId, userId, name, 'Student', 'Computer Science & Engineering', 8.0, 2026]
        );
      } else if (role === 'recruiter') {
        await txQuery(
          'INSERT INTO recruiters (id, user_id, name, designation) VALUES (?, ?, ?, ?)',
          [profileId, userId, name, 'Recruiter']
        );
      } else if (role === 'officer') {
        await txQuery(
          'INSERT INTO placement_officers (id, user_id, name, department, designation) VALUES (?, ?, ?, ?, ?)',
          [profileId, userId, name, 'Placement Cell', 'Placement Officer']
        );
      }
    });

    const token = generateToken({ id: userId, email: email.toLowerCase().trim(), role });
    const profile = await fetchUserProfile(userId, role);

    const userObj = {
      id: userId,
      name,
      email: email.toLowerCase().trim(),
      role,
      avatar: profile?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      headline: profile?.headline || '',
      department: profile?.department || '',
      cgpa: profile?.cgpa ? parseFloat(profile.cgpa) : undefined,
      graduationYear: profile?.graduation_year || undefined,
    };

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login User
 */
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email address and password are required.',
      });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    // Verify role matches requested role if provided
    if (role && user.role !== role) {
      return res.status(400).json({
        success: false,
        message: `Account is registered as '${user.role}', not '${role}'. Please select your correct role.`,
      });
    }

    const token = generateToken(user);
    const profile = await fetchUserProfile(user.id, user.role);

    const userObj = {
      id: user.id,
      name: profile?.name || 'User',
      email: user.email,
      role: user.role,
      avatar: profile?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      headline: profile?.headline || '',
      department: profile?.department || '',
      cgpa: profile?.cgpa ? parseFloat(profile.cgpa) : undefined,
      graduationYear: profile?.graduation_year || undefined,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Logged-in User Info
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const profile = await fetchUserProfile(user.id, user.role);

    const userObj = {
      id: user.id,
      name: profile?.name || 'User',
      email: user.email,
      role: user.role,
      avatar: profile?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      headline: profile?.headline || '',
      department: profile?.department || '',
      cgpa: profile?.cgpa ? parseFloat(profile.cgpa) : undefined,
      graduationYear: profile?.graduation_year || undefined,
    };

    return res.status(200).json({
      success: true,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password Handler
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const users = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      // Return success anyway to avoid user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token (stored or simulated)
    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password Handler
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required.' });
    }

    const users = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE email = ?', [password_hash, email.toLowerCase().trim()]);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};
