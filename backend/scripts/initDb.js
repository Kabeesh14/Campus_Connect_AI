const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

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
    } catch (e) {}
  }
  return {
    host: process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
    user: process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'railway',
  };
};

const initDatabase = async () => {
  const { host, port, user, password, database: dbName } = parseDbConfig();
  const ssl = process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false;

  console.log(`[DB INIT] Connecting to MySQL server at ${host}:${port} (target db: '${dbName}')...`);
  let connection;

  try {
    // 1. Connect directly to target database if possible
    try {
      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database: dbName,
        ssl,
        multipleStatements: true,
      });
      console.log(`[DB INIT] Connected directly to database '${dbName}'`);
    } catch (connErr) {
      console.log(`[DB INIT] Direct connection to '${dbName}' note (${connErr.message}). Attempting server connection & db creation...`);
      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        ssl,
        multipleStatements: true,
      });
      try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      } catch (e) {
        console.warn(`[DB INIT] CREATE DATABASE warning: ${e.message}`);
      }
      await connection.query(`USE \`${dbName}\`;`);
    }

    // 2. Read and execute DDL statements from schema.sql
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log(`[DB INIT] Executing schema DDL statements...`);
    await connection.query(sqlContent);
    console.log('[DB INIT] Database tables created successfully.');

    // 3. Seed default users & records
    console.log('[DB INIT] Seeding initial data...');
    const hashedStudentPwd = await bcrypt.hash('password', 10);
    const hashedOfficerPwd = await bcrypt.hash('password', 10);
    const hashedRecruiterPwd = await bcrypt.hash('password', 10);

    // Insert Users
    await connection.query(`
      INSERT IGNORE INTO users (id, email, password_hash, role) VALUES
      ('u-student', 'student@campus.edu', '${hashedStudentPwd}', 'student'),
      ('u-officer', 'officer@campus.edu', '${hashedOfficerPwd}', 'officer'),
      ('u-recruiter', 'recruiter@google.com', '${hashedRecruiterPwd}', 'recruiter');
    `);

    // Insert Student Profile
    await connection.query(`
      INSERT IGNORE INTO students (id, user_id, name, avatar, headline, department, cgpa, graduation_year, bio) VALUES
      ('s-1', 'u-student', 'Student User', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200', 'Final Year • Computer Science', 'Computer Science & Engineering', 8.50, 2026, 'Full-stack software developer passionate about AI and scalable backend systems.');
    `);

    // Insert Officer Profile
    await connection.query(`
      INSERT IGNORE INTO placement_officers (id, user_id, name, department, designation) VALUES
      ('o-1', 'u-officer', 'Dr. Rajesh Kumar', 'Training & Placement', 'Head of Placements');
    `);

    // Insert Recruiter Profile
    await connection.query(`
      INSERT IGNORE INTO recruiters (id, user_id, name, designation) VALUES
      ('r-1', 'u-recruiter', 'Sarah Jenkins', 'Lead Technical Recruiter');
    `);

    console.log('[DB INIT] Database Initialization and Seeding Completed Successfully!');
  } catch (error) {
    console.error('[DB INIT] Database Initialization Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
};

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
