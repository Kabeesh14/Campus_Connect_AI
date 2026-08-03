const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_connect_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// In-Memory Database Fallback Store for seamless local operation
const inMemoryDb = {
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
};

let useInMemoryFallback = false;

// Helper query function for executing SQL statements safely
const query = async (sql, params = []) => {
  if (!useInMemoryFallback) {
    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (error) {
      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ER_ACCESS_DENIED_ERROR' ||
        error.message.includes('Access denied')
      ) {
        console.warn('MySQL connection unavailable. Switching seamlessly to local resilient data store.');
        useInMemoryFallback = true;
      } else {
        throw error;
      }
    }
  }

  // Handle queries using in-memory store
  const cleanSql = sql.trim().toUpperCase();

  if (cleanSql.startsWith('SELECT')) {
    if (sql.includes('COUNT(*)')) {
      if (sql.includes('FROM students')) return [{ count: inMemoryDb.students.length }];
      if (sql.includes('FROM applications')) return [{ count: inMemoryDb.applications.length }];
      if (sql.includes('FROM companies')) return [{ count: inMemoryDb.companies.length }];
      if (sql.includes('FROM notifications')) {
        const userId = params[0];
        const unread = inMemoryDb.notifications.filter((n) => n.user_id === userId && !n.read_status).length;
        return [{ unreadCount: unread, count: inMemoryDb.notifications.length }];
      }
      return [{ count: 0 }];
    }

    if (sql.includes('FROM users')) {
      if (sql.includes('WHERE email = ?')) {
        const emailParam = params[0] ? String(params[0]).toLowerCase().trim() : '';
        return inMemoryDb.users.filter((u) => u.email.toLowerCase() === emailParam);
      }
      if (sql.includes('WHERE id = ?')) {
        return inMemoryDb.users.filter((u) => u.id === params[0]);
      }
      return inMemoryDb.users;
    }

    if (sql.includes('FROM students')) {
      if (sql.includes('WHERE user_id = ?')) {
        return inMemoryDb.students.filter((s) => s.user_id === params[0]);
      }
      if (sql.includes('WHERE id = ?')) {
        return inMemoryDb.students.filter((s) => s.id === params[0]);
      }
      return inMemoryDb.students;
    }

    if (sql.includes('FROM recruiters')) {
      if (sql.includes('WHERE user_id = ?')) {
        return inMemoryDb.recruiters.filter((r) => r.user_id === params[0]);
      }
      return inMemoryDb.recruiters;
    }

    if (sql.includes('FROM placement_officers')) {
      if (sql.includes('WHERE user_id = ?')) {
        return inMemoryDb.placement_officers.filter((o) => o.user_id === params[0]);
      }
      return inMemoryDb.placement_officers;
    }

    if (sql.includes('FROM companies')) {
      if (sql.includes('WHERE id = ?')) {
        return inMemoryDb.companies.filter((c) => c.id === params[0]);
      }
      return inMemoryDb.companies;
    }

    if (sql.includes('FROM jobs')) {
      if (sql.includes('WHERE id = ?')) {
        return inMemoryDb.jobs.filter((j) => j.id === params[0]);
      }
      return inMemoryDb.jobs;
    }

    if (sql.includes('FROM applications')) {
      if (sql.includes('WHERE student_id = ?')) {
        return inMemoryDb.applications.filter((a) => a.student_id === params[0]);
      }
      if (sql.includes('WHERE job_id = ? AND student_id = ?')) {
        return inMemoryDb.applications.filter((a) => a.job_id === params[0] && a.student_id === params[1]);
      }
      return inMemoryDb.applications;
    }

    if (sql.includes('FROM notifications')) {
      if (sql.includes('WHERE user_id = ?')) {
        return inMemoryDb.notifications.filter((n) => n.user_id === params[0]);
      }
      return inMemoryDb.notifications;
    }

    if (sql.includes('FROM skills')) {
      return inMemoryDb.skills.filter((sk) => sk.student_id === params[0]);
    }

    if (sql.includes('FROM projects')) {
      return inMemoryDb.projects.filter((p) => p.student_id === params[0]);
    }

    if (sql.includes('FROM certifications')) {
      return inMemoryDb.certifications.filter((c) => c.student_id === params[0]);
    }

    if (sql.includes('FROM resumes')) {
      return inMemoryDb.resumes.filter((r) => r.student_id === params[0]);
    }

    if (sql.includes('FROM ai_chats')) {
      return inMemoryDb.ai_chats.filter((c) => c.user_id === params[0] && c.tool_type === params[1]);
    }

    return [];
  }

  if (cleanSql.startsWith('INSERT INTO USERS')) {
    const newUser = { id: params[0], email: params[1], password_hash: params[2], role: params[3] };
    inMemoryDb.users.push(newUser);
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
    inMemoryDb.students.push(newStudent);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO RECRUITERS')) {
    const newRecruiter = { id: params[0], user_id: params[1], name: params[2], designation: params[3] };
    inMemoryDb.recruiters.push(newRecruiter);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO PLACEMENT_OFFICERS')) {
    const newOfficer = { id: params[0], user_id: params[1], name: params[2], department: params[3], designation: params[4] };
    inMemoryDb.placement_officers.push(newOfficer);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO JOBS')) {
    const newJob = {
      id: params[0], company_id: params[1], recruiter_id: params[2], company: params[3], logo: params[4],
      role: params[5], package: params[6], location: params[7], type: params[8], remote: params[9],
      requirements: params[10], responsibilities: params[11], eligibility: params[12], skills: params[13],
      deadline: params[14], description: params[15], match_score: 90, posted_days: 0,
    };
    inMemoryDb.jobs.push(newJob);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO APPLICATIONS')) {
    const newApp = {
      id: params[0], job_id: params[1], student_id: params[2], role: params[3], company: params[4],
      logo: params[5], stage: params[6] || 'applied', status: params[7] || 'pending',
      applied_date: params[8], updated_date: params[9], salary: params[10],
    };
    inMemoryDb.applications.push(newApp);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO NOTIFICATIONS')) {
    const newNotif = { id: params[0], user_id: params[1], type: params[2] || 'announcement', title: params[3], body: params[4], time: params[5] || 'Just now', read_status: 0 };
    inMemoryDb.notifications.push(newNotif);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO SKILLS')) {
    inMemoryDb.skills.push({ id: params[0], student_id: params[1], name: params[2], level: params[3], category: params[4] });
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO PROJECTS')) {
    inMemoryDb.projects.push({ id: params[0], student_id: params[1], name: params[2], desc: params[3], stack: params[4], link: params[5] });
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO CERTIFICATIONS')) {
    inMemoryDb.certifications.push({ id: params[0], student_id: params[1], name: params[2], issuer: params[3], year: params[4] });
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO AI_CHATS')) {
    const newChat = {
      id: params[0], user_id: params[1], tool_type: params[2], question: params[3], response: params[4], created_at: new Date().toISOString(),
    };
    inMemoryDb.ai_chats.push(newChat);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO RESUMES')) {
    const newResume = {
      id: params[0], student_id: params[1], file_name: params[2], file_path: params[3], file_size: params[4], mime_type: params[5], uploaded_at: new Date().toISOString(),
    };
    inMemoryDb.resumes.push(newResume);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE USERS')) {
    const u = inMemoryDb.users.find((item) => item.email.toLowerCase() === String(params[1]).toLowerCase());
    if (u) u.password_hash = params[0];
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE STUDENTS')) {
    const s = inMemoryDb.students.find((item) => item.user_id === params[1] || item.id === params[7]);
    if (s) {
      if (params[0]) s.name = params[0];
      if (params[1]) s.headline = params[1];
      if (params[2]) s.department = params[2];
      if (params[3]) s.cgpa = params[3];
      if (params[4]) s.graduation_year = params[4];
      if (params[5]) s.bio = params[5];
      if (params[6]) s.phone = params[6];
    }
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE COMPANIES')) {
    const c = inMemoryDb.companies.find((item) => item.id === params[7] || item.id === params[1]);
    if (c) {
      if (params[0]) c.name = params[0];
    }
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE RESUMES')) {
    const r = inMemoryDb.resumes.find((item) => item.student_id === params[1]);
    if (r) r.parsed_content = params[0];
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('UPDATE NOTIFICATIONS')) {
    const userId = params[0];
    inMemoryDb.notifications.forEach((n) => { if (n.user_id === userId) n.read_status = 1; });
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM SKILLS')) {
    inMemoryDb.skills = inMemoryDb.skills.filter((sk) => sk.id !== params[0]);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM PROJECTS')) {
    inMemoryDb.projects = inMemoryDb.projects.filter((p) => p.id !== params[0]);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM CERTIFICATIONS')) {
    inMemoryDb.certifications = inMemoryDb.certifications.filter((c) => c.id !== params[0]);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM APPLICATIONS')) {
    inMemoryDb.applications = inMemoryDb.applications.filter((a) => a.id !== params[0]);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM NOTIFICATIONS')) {
    inMemoryDb.notifications = inMemoryDb.notifications.filter((n) => n.user_id !== params[0]);
    return { affectedRows: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM AI_CHATS')) {
    if (sql.includes('WHERE id = ?')) {
      inMemoryDb.ai_chats = inMemoryDb.ai_chats.filter((c) => c.id !== params[0]);
    } else {
      inMemoryDb.ai_chats = inMemoryDb.ai_chats.filter((c) => !(c.user_id === params[0] && c.tool_type === params[1]));
    }
    return { affectedRows: 1 };
  }

  return [];
};

// Health test database connectivity
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database Connected Successfully.');
    connection.release();
  } catch (error) {
    console.warn('MySQL Connection Warning:', error.message);
    console.warn('Resilient backend active with in-memory persistence fallback.');
  }
};

/**
 * Execute multi-step operations inside a Database Transaction (ACID compliant)
 */
const withTransaction = async (callback) => {
  if (useInMemoryFallback) {
    return await callback(query);
  }
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
};

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection,
  inMemoryDb,
};
