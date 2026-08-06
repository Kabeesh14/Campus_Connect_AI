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
  return 'User';
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

    console.log(`\n=================== AUTH REGISTER ATTEMPT ===================`);
    console.log(`[AUTH REGISTER] Incoming Registration Request: Name="${name}", Email="${email}", Role="${role}"`);

    if (!name || !email || !password || !role) {
      console.log(`[AUTH REGISTER FAILED] Missing required fields in request body.`);
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required fields.',
      });
    }

    const validRoles = ['student', 'recruiter', 'officer'];
    if (!validRoles.includes(role)) {
      console.log(`[AUTH REGISTER FAILED] Invalid role provided: "${role}"`);
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified.',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // 1. Check duplicate email in users table
    console.log(`[AUTH REGISTER DB] Executing SQL: SELECT id FROM users WHERE email = '${cleanEmail}'`);
    const existing = await query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    console.log(`[AUTH REGISTER DB] SQL Query Result: ${existing.length} record(s) found.`);

    if (existing.length > 0) {
      console.log(`[AUTH REGISTER FAILED] Account already exists for email: ${cleanEmail}`);
      return res.status(409).json({
        success: false,
        message: `An account with email '${cleanEmail}' already exists. Please sign in instead.`,
      });
    }

    // 2. Hash password with bcrypt before saving
    console.log(`[AUTH REGISTER BCRYPT] Hashing plain text password with bcrypt (salt rounds = 10)...`);
    const password_hash = await bcrypt.hash(password, 10);
    console.log(`[AUTH REGISTER BCRYPT] Generated bcrypt Password Hash: ${password_hash}`);

    const userId = 'u-' + crypto.randomUUID();
    const profileId = 'p-' + crypto.randomUUID();

    // 3. Save user & role profile in database transaction
    console.log(`[AUTH REGISTER DB] Inserting User record into 'users' table...`);
    await withTransaction(async (txQuery) => {
      await txQuery(
        'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [userId, cleanEmail, password_hash, role]
      );

      if (role === 'student') {
        console.log(`[AUTH REGISTER DB] Inserting Student Profile record into 'students' table...`);
        await txQuery(
          'INSERT INTO students (id, user_id, name, headline, department, cgpa, graduation_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [profileId, userId, name, 'Student', 'Computer Science & Engineering', 8.0, 2026]
        );
      } else if (role === 'recruiter') {
        console.log(`[AUTH REGISTER DB] Inserting Recruiter Profile record into 'recruiters' table...`);
        await txQuery(
          'INSERT INTO recruiters (id, user_id, name, designation) VALUES (?, ?, ?, ?)',
          [profileId, userId, name, 'Recruiter']
        );
      } else if (role === 'officer') {
        console.log(`[AUTH REGISTER DB] Inserting Placement Officer Profile record into 'placement_officers' table...`);
        await txQuery(
          'INSERT INTO placement_officers (id, user_id, name, department, designation) VALUES (?, ?, ?, ?, ?)',
          [profileId, userId, name, 'Placement Cell', 'Placement Officer']
        );
      }
    });

    // 4. Generate JWT
    const token = generateToken({ id: userId, email: cleanEmail, role });
    console.log(`[AUTH REGISTER JWT] JWT Token generated successfully for User ID: ${userId}`);

    const profile = await fetchUserProfile(userId, role);

    const userObj = {
      id: userId,
      name,
      email: cleanEmail,
      role,
      avatar: profile?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      headline: profile?.headline || '',
      department: profile?.department || '',
      cgpa: profile?.cgpa ? parseFloat(profile.cgpa) : undefined,
      graduationYear: profile?.graduation_year || undefined,
    };

    console.log(`[AUTH REGISTER SUCCESS] Account '${cleanEmail}' (${role}) created & authenticated successfully.`);
    console.log(`=============================================================\n`);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userObj,
    });
  } catch (error) {
    console.error(`[AUTH REGISTER ERROR] Exception caught:`, error);
    next(error);
  }
};

/**
 * Login User
 */
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    console.log(`\n=================== AUTH LOGIN ATTEMPT ===================`);
    console.log(`[AUTH LOGIN] Incoming Login Request: Email="${email}", Role="${role || 'unspecified'}"`);

    if (!email || !password) {
      console.log(`[AUTH LOGIN FAILED] Email address and password are required.`);
      return res.status(400).json({
        success: false,
        message: 'Email address and password are required.',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // 1. SQL Query to fetch user
    console.log(`[AUTH LOGIN DB] Executing SQL: SELECT * FROM users WHERE email = '${cleanEmail}'`);
    const users = await query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    console.log(`[AUTH LOGIN DB] SQL Query Result: ${users.length} row(s) returned.`);

    // 2. Log User Found or Not
    if (users.length === 0) {
      console.log(`[AUTH LOGIN FAILED] User Found: NO. Email '${cleanEmail}' does not exist in 'users' table.`);
      return res.status(401).json({
        success: false,
        message: `No account found with email address '${cleanEmail}'. Please sign up first.`,
      });
    }

    const user = users[0];
    console.log(`[AUTH LOGIN SUCCESS] User Found: YES. User ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);

    // 3. Log Stored Password Hash & bcrypt.compare() result
    console.log(`[AUTH LOGIN BCRYPT] Stored Password Hash: ${user.password_hash}`);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log(`[AUTH LOGIN BCRYPT] bcrypt.compare() result: ${isPasswordValid ? 'MATCH (True)' : 'MISMATCH (False)'}`);

    if (!isPasswordValid) {
      console.log(`[AUTH LOGIN FAILED] Incorrect password entered for email: ${cleanEmail}`);
      return res.status(401).json({
        success: false,
        message: 'Incorrect password entered. Please double-check your password.',
      });
    }

    // 4. Role match validation
    if (role && user.role !== role) {
      console.log(`[AUTH LOGIN FAILED] Role mismatch! Account role is '${user.role}', but login selected '${role}'.`);
      return res.status(400).json({
        success: false,
        message: `Account is registered as '${user.role}', not '${role}'. Please select '${user.role}' role tab.`,
      });
    }

    // 5. Generate JWT Token
    const token = generateToken(user);
    console.log(`[AUTH LOGIN JWT] JWT Generation Result: SUCCESS. Token generated for User ID: ${user.id}`);

    const profile = await fetchUserProfile(user.id, user.role);

    const userObj = {
      id: user.id,
      name: sanitizeName(profile?.name, user.email),
      email: user.email,
      role: user.role,
      avatar: normalizeAvatarPath(profile?.avatar),
      headline: (profile?.headline && !profile.headline.startsWith('/uploads/') && profile.headline !== user.id) ? profile.headline : (user.role === 'student' ? 'Student' : user.role),
      department: profile?.department || '',
      cgpa: profile?.cgpa ? parseFloat(profile.cgpa) : undefined,
      graduationYear: profile?.graduation_year || undefined,
    };

    console.log(`[AUTH LOGIN SUCCESS] User '${user.email}' authenticated successfully as '${user.role}'.`);
    console.log(`===========================================================\n`);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userObj,
    });
  } catch (error) {
    console.error(`[AUTH LOGIN ERROR] Exception caught:`, error);
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
      name: sanitizeName(profile?.name, user.email),
      email: user.email,
      role: user.role,
      avatar: normalizeAvatarPath(profile?.avatar),
      headline: (profile?.headline && !profile.headline.startsWith('/uploads/') && profile.headline !== user.id) ? profile.headline : (user.role === 'student' ? 'Student' : user.role),
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

    const users = await query('SELECT id FROM users WHERE email = ?', [String(email).toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

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

    const cleanEmail = String(email).toLowerCase().trim();
    const users = await query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE email = ?', [password_hash, cleanEmail]);

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
