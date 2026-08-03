const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const initDatabase = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'campus_connect_db';

  console.log(`Connecting to MySQL server at ${host}:${port}...`);
  let connection;

  try {
    // 1. Connect without selecting database to create database if not exists
    connection = await mysql.createConnection({ host, port, user, password });
    console.log(`Creating database '${dbName}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);

    // 2. Read and execute DDL statements from schema.sql
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Split queries by semicolon
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} schema statements...`);
    for (const stmt of statements) {
      await connection.query(stmt);
    }
    console.log('Database tables created successfully.');

    // 3. Seed default users & records
    console.log('Seeding initial data...');
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

    console.log('Database Initialization and Seeding Completed Successfully!');
  } catch (error) {
    console.error('Database Initialization Failed:', error.message);
  } finally {
    if (connection) await connection.end();
  }
};

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
