const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const parseDbConfig = () => {
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;
  if (dbUrl && dbUrl.startsWith('mysql')) {
    try {
      const parsed = new URL(dbUrl);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '3306', 10),
        user: decodeURIComponent(parsed.username || 'root'),
        password: decodeURIComponent(parsed.password || ''),
        database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : (process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'railway'),
      };
    } catch (e) {
      console.warn('[DB] Failed to parse MYSQL_URL/DATABASE_URL, falling back to individual ENV vars');
    }
  }

  return {
    host: process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
    user: process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'railway',
  };
};

const dbConfig = parseDbConfig();

const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  ssl: process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// File-backed Local Database Store for seamless local operation
const DATA_DIR = path.join(__dirname, '../data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'local_db.json');

const defaultDbState = () => ({
  users: [
    { id: 'u-student', email: 'student@campus.edu', password_hash: bcrypt.hashSync('password', 10), role: 'student' },
    { id: 'u-officer', email: 'officer@campus.edu', password_hash: bcrypt.hashSync('password', 10), role: 'officer' },
    { id: 'u-recruiter', email: 'recruiter@google.com', password_hash: bcrypt.hashSync('password', 10), role: 'recruiter' },
  ],
  students: [
    {
      id: 's-1',
      user_id: 'u-student',
      name: 'Student User',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      headline: 'Final Year • Computer Science',
      department: 'Computer Science & Engineering',
      cgpa: 8.60,
      graduation_year: 2026,
      bio: 'Full-stack software developer passionate about AI and scalable backend systems.',
    },
  ],
  recruiters: [
    { id: 'r-1', user_id: 'u-recruiter', name: 'Sarah Jenkins', company_id: 'c1', designation: 'Lead Technical Recruiter' },
  ],
  placement_officers: [
    { id: 'o-1', user_id: 'u-officer', name: 'Dr. Rajesh Kumar', department: 'Training & Placement', designation: 'Head of Placements' },
  ],
  companies: [
    { id: 'c1', name: 'Google', logo: 'https://logo.clearbit.com/google.com', industry: 'Technology', location: 'Mountain View, CA', salary: '$120K - $180K', hiring: 1, open_roles: 12 },
  ],
  jobs: [
    { id: 'j1', company_id: 'c1', recruiter_id: 'r-1', company: 'Google', logo: 'https://logo.clearbit.com/google.com', role: 'SWE Intern — Search', package: '$8,500/mo', location: 'Bangalore', type: 'Internship', remote: 0, match_score: 92, posted_days: 3, deadline: '14 days left', description: 'Join Search team.' },
  ],
  applications: [],
  notifications: [],
  skills: [],
  projects: [],
  certifications: [],
  resumes: [],
  ai_chats: [],
});

let inMemoryDb = defaultDbState();

// Load persistent local db from disk if available
const loadLocalDb = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const content = fs.readFileSync(LOCAL_DB_FILE, 'utf8');
      inMemoryDb = JSON.parse(content);
      console.log(`[DB] Persistent local database loaded from ${LOCAL_DB_FILE}`);
    } else {
      saveLocalDb();
    }
  } catch (err) {
    console.warn('[DB] Error loading local DB file, using default state:', err.message);
    inMemoryDb = defaultDbState();
  }
};

const saveLocalDb = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf8');
  } catch (err) {
    console.warn('[DB] Error saving local DB file:', err.message);
  }
};

// Initialize disk storage
loadLocalDb();

let useInMemoryFallback = false;

// Helper query function for executing SQL statements safely
const query = async (sql, params = []) => {
  if (!useInMemoryFallback) {
    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (error) {
      console.warn(`[DB] MySQL query execution error (${error.code || error.message}). Switching to persistent local data store.`);
      useInMemoryFallback = true;
    }
  }

  // Handle queries using local persistent data store
  const cleanSql = sql.trim().toUpperCase();

  if (cleanSql.startsWith('SELECT')) {
    if (sql.includes('COUNT(*)')) {
      if (sql.includes('FROM students')) return [{ count: inMemoryDb.students.length }];
      if (sql.includes('FROM applications')) return [{ count: inMemoryDb.applications.length }];
      if (sql.includes('FROM companies')) return [{ count: inMemoryDb.companies.length }];
      if (sql.includes('FROM notifications')) {
        const userId = params[0];
        const unread = (inMemoryDb.notifications || []).filter((n) => n.user_id === userId && !n.read_status).length;
        return [{ unreadCount: unread, count: (inMemoryDb.notifications || []).length }];
      }
      return [{ count: 0 }];
    }

    if (sql.includes('FROM users')) {
      if (sql.includes('WHERE email = ?')) {
        const emailParam = params[0] ? String(params[0]).toLowerCase().trim() : '';
        const found = (inMemoryDb.users || []).filter((u) => String(u.email).toLowerCase().trim() === emailParam);
        return found;
      }
      if (sql.includes('WHERE id = ?')) {
        return (inMemoryDb.users || []).filter((u) => u.id === params[0]);
      }
      return inMemoryDb.users || [];
    }

    if (sql.includes('FROM students')) {
      if (sql.includes('WHERE user_id = ?')) {
        return (inMemoryDb.students || []).filter((s) => s.user_id === params[0]);
      }
      if (sql.includes('WHERE id = ?')) {
        return (inMemoryDb.students || []).filter((s) => s.id === params[0]);
      }
      return inMemoryDb.students || [];
    }

    if (sql.includes('FROM recruiters')) {
      if (sql.includes('WHERE user_id = ?')) {
        return (inMemoryDb.recruiters || []).filter((r) => r.user_id === params[0]);
      }
      return inMemoryDb.recruiters || [];
    }

    if (sql.includes('FROM placement_officers')) {
      if (sql.includes('WHERE user_id = ?')) {
        return (inMemoryDb.placement_officers || []).filter((o) => o.user_id === params[0]);
      }
      return inMemoryDb.placement_officers || [];
    }

    if (sql.includes('FROM saved_jobs')) {
      const userId = params[0];
      return (inMemoryDb.saved_jobs || []).filter((sj) => sj.user_id === userId);
    }

    if (sql.includes('FROM companies')) {
      if (sql.includes('WHERE id = ?')) {
        return (inMemoryDb.companies || []).filter((c) => c.id === params[0]);
      }
      return inMemoryDb.companies || [];
    }

    if (sql.includes('FROM jobs')) {
      if (sql.includes('WHERE id = ?')) {
        return (inMemoryDb.jobs || []).filter((j) => j.id === params[0]);
      }
      return inMemoryDb.jobs || [];
    }

    if (sql.includes('FROM applications')) {
      if (sql.includes('WHERE student_id = ?')) {
        return (inMemoryDb.applications || []).filter((a) => a.student_id === params[0]);
      }
      if (sql.includes('WHERE job_id = ? AND student_id = ?')) {
        return (inMemoryDb.applications || []).filter((a) => a.job_id === params[0] && a.student_id === params[1]);
      }
      return inMemoryDb.applications || [];
    }

    if (sql.includes('FROM notifications')) {
      if (sql.includes('WHERE user_id = ?')) {
        return (inMemoryDb.notifications || []).filter((n) => n.user_id === params[0]);
      }
      return inMemoryDb.notifications || [];
    }

    if (sql.includes('FROM skills')) {
      return (inMemoryDb.skills || []).filter((sk) => sk.student_id === params[0]);
    }

    if (sql.includes('FROM projects')) {
      if (sql.includes('WHERE id = ? AND student_id = ?')) {
        return (inMemoryDb.projects || []).filter((p) => p.id === params[0] && p.student_id === params[1]);
      }
      return (inMemoryDb.projects || []).filter((p) => p.student_id === params[0]);
    }

    if (sql.includes('FROM certifications')) {
      if (sql.includes('WHERE id = ? AND student_id = ?')) {
        return (inMemoryDb.certifications || []).filter((c) => c.id === params[0] && c.student_id === params[1]);
      }
      return (inMemoryDb.certifications || []).filter((c) => c.student_id === params[0]);
    }

    if (sql.includes('FROM achievements')) {
      if (sql.includes('WHERE id = ? AND student_id = ?')) {
        return (inMemoryDb.achievements || []).filter((a) => a.id === params[0] && a.student_id === params[1]);
      }
      return (inMemoryDb.achievements || []).filter((a) => a.student_id === params[0]);
    }

    if (sql.includes('FROM resumes')) {
      return (inMemoryDb.resumes || []).filter((r) => r.student_id === params[0]);
    }

    if (sql.includes('FROM ai_chats')) {
      return (inMemoryDb.ai_chats || []).filter((c) => c.user_id === params[0] && c.tool_type === params[1]);
    }

    return [];
  }

  if (cleanSql.startsWith('INSERT INTO USERS')) {
    const newUser = { id: params[0], email: String(params[1]).toLowerCase().trim(), password_hash: params[2], role: params[3] };
    if (!inMemoryDb.users) inMemoryDb.users = [];
    inMemoryDb.users.push(newUser);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO STUDENTS')) {
    const newStudent = {
      id: params[0],
      user_id: params[1],
      name: params[2],
      headline: params[3],
      department: params[4],
      cgpa: params[5],
      graduation_year: params[6],
    };
    if (!inMemoryDb.students) inMemoryDb.students = [];
    inMemoryDb.students.push(newStudent);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO RECRUITERS')) {
    const newRecruiter = { id: params[0], user_id: params[1], name: params[2], designation: params[3] };
    if (!inMemoryDb.recruiters) inMemoryDb.recruiters = [];
    inMemoryDb.recruiters.push(newRecruiter);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO PLACEMENT_OFFICERS')) {
    const newOfficer = { id: params[0], user_id: params[1], name: params[2], department: params[3], designation: params[4] };
    if (!inMemoryDb.placement_officers) inMemoryDb.placement_officers = [];
    inMemoryDb.placement_officers.push(newOfficer);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO JOBS')) {
    const newJob = {
      id: params[0], company_id: params[1], recruiter_id: params[2], company: params[3], logo: params[4],
      role: params[5], package: params[6], location: params[7], type: params[8], remote: params[9],
      requirements: params[10], responsibilities: params[11], eligibility: params[12], skills: params[13],
      deadline: params[14], description: params[15], match_score: 90, posted_days: 0,
    };
    if (!inMemoryDb.jobs) inMemoryDb.jobs = [];
    inMemoryDb.jobs.push(newJob);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO APPLICATIONS')) {
    const newApp = {
      id: params[0], job_id: params[1], student_id: params[2], role: params[3], company: params[4],
      logo: params[5], stage: params[6] || 'applied', status: params[7] || 'pending',
      applied_date: params[8], updated_date: params[9], salary: params[10],
    };
    if (!inMemoryDb.applications) inMemoryDb.applications = [];
    inMemoryDb.applications.push(newApp);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO NOTIFICATIONS')) {
    const newNotif = { id: params[0], user_id: params[1], type: params[2] || 'announcement', title: params[3], body: params[4], time: params[5] || 'Just now', read_status: 0 };
    if (!inMemoryDb.notifications) inMemoryDb.notifications = [];
    inMemoryDb.notifications.push(newNotif);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO SKILLS')) {
    if (!inMemoryDb.skills) inMemoryDb.skills = [];
    inMemoryDb.skills.push({ id: params[0], student_id: params[1], name: params[2], level: params[3], category: params[4] });
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO PROJECTS')) {
    if (!inMemoryDb.projects) inMemoryDb.projects = [];
    inMemoryDb.projects.push({
      id: params[0],
      student_id: params[1],
      name: params[2],
      desc: params[3],
      stack: params[4],
      link: params[5] || '',
      github_url: params[6] || params[5] || '',
      live_demo_url: params[7] || '',
      start_date: params[8] || '',
      end_date: params[9] || '',
      image_url: params[10] || '',
    });
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO CERTIFICATIONS')) {
    if (!inMemoryDb.certifications) inMemoryDb.certifications = [];
    inMemoryDb.certifications.push({
      id: params[0],
      student_id: params[1],
      name: params[2],
      issuer: params[3],
      year: params[4] || '',
      issue_date: params[5] || params[4] || '',
      credential_id: params[6] || '',
      credential_url: params[7] || '',
      certificate_file_url: params[8] || '',
    });
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO ACHIEVEMENTS')) {
    if (!inMemoryDb.achievements) inMemoryDb.achievements = [];
    inMemoryDb.achievements.push({
      id: params[0],
      student_id: params[1],
      title: params[2],
      description: params[3] || '',
      organization: params[4] || '',
      achievement_date: params[5] || '',
      url: params[6] || '',
      proof_url: params[7] || '',
      created_at: new Date().toISOString(),
    });
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO SAVED_JOBS')) {
    const newItem = { id: params[0], user_id: params[1], job_id: params[2], job_data: typeof params[3] === 'string' ? params[3] : JSON.stringify(params[3] || {}), created_at: new Date().toISOString() };
    if (!inMemoryDb.saved_jobs) inMemoryDb.saved_jobs = [];
    inMemoryDb.saved_jobs = inMemoryDb.saved_jobs.filter((sj) => !(sj.user_id === params[1] && sj.job_id === params[2]));
    inMemoryDb.saved_jobs.push(newItem);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM SAVED_JOBS')) {
    const userId = params[0];
    const jobId = params[1];
    if (!inMemoryDb.saved_jobs) inMemoryDb.saved_jobs = [];
    inMemoryDb.saved_jobs = inMemoryDb.saved_jobs.filter((sj) => !(sj.user_id === userId && sj.job_id === jobId));
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO AI_CHATS')) {
    const newChat = {
      id: params[0], user_id: params[1], tool_type: params[2], question: params[3], response: params[4], created_at: new Date().toISOString(),
    };
    if (!inMemoryDb.ai_chats) inMemoryDb.ai_chats = [];
    inMemoryDb.ai_chats.push(newChat);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO RESUMES')) {
    const newResume = {
      id: params[0], student_id: params[1], file_name: params[2], file_path: params[3], file_size: params[4], mime_type: params[5], uploaded_at: new Date().toISOString(),
    };
    if (!inMemoryDb.resumes) inMemoryDb.resumes = [];
    inMemoryDb.resumes.push(newResume);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE USERS')) {
    const u = (inMemoryDb.users || []).find((item) => String(item.email).toLowerCase() === String(params[1]).toLowerCase());
    if (u) u.password_hash = params[0];
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.includes('SET AVATAR = ?')) {
    const s = (inMemoryDb.students || []).find((item) => item.user_id === params[1] || item.id === params[1]);
    if (s) s.avatar = params[0];
    const r = (inMemoryDb.recruiters || []).find((item) => item.user_id === params[1] || item.id === params[1]);
    if (r) r.avatar = params[0];
    const o = (inMemoryDb.placement_officers || []).find((item) => item.user_id === params[1] || item.id === params[1]);
    if (o) o.avatar = params[0];
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE STUDENTS')) {
    const s = (inMemoryDb.students || []).find((item) => item.user_id === params[7] || item.user_id === params[1] || item.id === params[7]);
    if (s) {
      if (params[0] && typeof params[0] === 'string' && !params[0].startsWith('/uploads/')) s.name = params[0];
      if (params[1] && typeof params[1] === 'string' && !params[1].startsWith('/uploads/')) s.headline = params[1];
      if (params[2]) s.department = params[2];
      if (params[3]) s.cgpa = params[3];
      if (params[4]) s.graduation_year = params[4];
      if (params[5]) s.bio = params[5];
      if (params[6]) s.phone = params[6];
    }
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE COMPANIES')) {
    const c = (inMemoryDb.companies || []).find((item) => item.id === params[7] || item.id === params[1]);
    if (c) {
      if (params[0]) c.name = params[0];
    }
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE RESUMES')) {
    const r = (inMemoryDb.resumes || []).find((item) => item.student_id === params[1]);
    if (r) r.parsed_content = params[0];
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE PROJECTS')) {
    const projId = params[params.length - 2];
    const studId = params[params.length - 1];
    const p = (inMemoryDb.projects || []).find((item) => item.id === projId && item.student_id === studId);
    if (p) {
      p.name = params[0];
      p.desc = params[1];
      p.stack = params[2];
      p.github_url = params[3];
      p.live_demo_url = params[4];
      p.start_date = params[5];
      p.end_date = params[6];
      if (params[7]) p.image_url = params[7];
      p.link = params[3] || params[4] || p.link;
    }
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE CERTIFICATIONS')) {
    const certId = params[params.length - 2];
    const studId = params[params.length - 1];
    const c = (inMemoryDb.certifications || []).find((item) => item.id === certId && item.student_id === studId);
    if (c) {
      c.name = params[0];
      c.issuer = params[1];
      c.issue_date = params[2];
      c.credential_id = params[3];
      c.credential_url = params[4];
      if (params[5]) c.certificate_file_url = params[5];
      c.year = params[2] || c.year;
    }
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE ACHIEVEMENTS')) {
    const achId = params[params.length - 2];
    const studId = params[params.length - 1];
    const a = (inMemoryDb.achievements || []).find((item) => item.id === achId && item.student_id === studId);
    if (a) {
      a.title = params[0];
      a.description = params[1];
      a.organization = params[2];
      a.achievement_date = params[3];
      a.url = params[4];
      if (params[5]) a.proof_url = params[5];
    }
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE NOTIFICATIONS')) {
    const userId = params[0];
    (inMemoryDb.notifications || []).forEach((n) => { if (n.user_id === userId) n.read_status = 1; });
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM SKILLS')) {
    inMemoryDb.skills = (inMemoryDb.skills || []).filter((sk) => sk.id !== params[0]);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM PROJECTS')) {
    inMemoryDb.projects = (inMemoryDb.projects || []).filter((p) => p.id !== params[0]);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM CERTIFICATIONS')) {
    inMemoryDb.certifications = (inMemoryDb.certifications || []).filter((c) => c.id !== params[0]);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM ACHIEVEMENTS')) {
    inMemoryDb.achievements = (inMemoryDb.achievements || []).filter((a) => a.id !== params[0]);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM APPLICATIONS')) {
    inMemoryDb.applications = (inMemoryDb.applications || []).filter((a) => a.id !== params[0]);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM NOTIFICATIONS')) {
    inMemoryDb.notifications = (inMemoryDb.notifications || []).filter((n) => n.user_id !== params[0]);
    saveLocalDb();
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM AI_CHATS')) {
    if (sql.includes('WHERE id = ?')) {
      inMemoryDb.ai_chats = (inMemoryDb.ai_chats || []).filter((c) => c.id !== params[0]);
    } else {
      inMemoryDb.ai_chats = (inMemoryDb.ai_chats || []).filter((c) => !(c.user_id === params[0] && c.tool_type === params[1]));
    }
    saveLocalDb();
    return { affectedRows: 1 };
  }

  return [];
};

// Health test database connectivity
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    console.log(`[DB] ✅ Connected successfully to MySQL server at ${dbConfig.host}:${dbConfig.port} (database: ${dbConfig.database})`);
    connection.release();
    useInMemoryFallback = false;
  } catch (error) {
    console.warn(`[DB] ⚠️  MySQL Connection Note (${dbConfig.host}:${dbConfig.port}):`, error.message);
    console.warn('[DB] 💡 Active fallback: Persistent local disk store (data/local_db.json)');
    useInMemoryFallback = true;
  }
};

/**
 * Execute multi-step operations inside a Database Transaction (ACID compliant)
 */
const withTransaction = async (callback) => {
  if (useInMemoryFallback) {
    return await callback(query);
  }
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const txQuery = async (sql, params = []) => {
        const [results] = await connection.execute(sql, params);
        return results;
      };
      const result = await callback(txQuery);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.warn('[DB] Transaction MySQL connection failed. Retrying with persistent local data store.');
    useInMemoryFallback = true;
    return await callback(query);
  }
};

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection,
  inMemoryDb,
};
