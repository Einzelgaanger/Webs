/**
 * Database Initialization Script for Student Performance Tracker
 * 
 * This script initializes the database with the initial data:
 * - Creates tables based on the schema
 * - Adds 6 academic units
 * - Creates 1 teacher user and 48 student users
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Function to hash a password using scrypt
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${derivedKey}.${salt}`;
}

// Main initialization function
async function initDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Create tables
    await createTables();
    
    // Insert initial data
    await insertUnits();
    await insertUsers();
    
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Create database tables
async function createTables() {
  console.log('Creating tables...');
  
  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      admission_number VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      profile_image_url VARCHAR(255),
      rank INTEGER,
      role VARCHAR(20) DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create units table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS units (
      code VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create notes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_url VARCHAR(255),
      unit_code VARCHAR(20) REFERENCES units(code),
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create assignments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_url VARCHAR(255),
      unit_code VARCHAR(20) REFERENCES units(code),
      user_id INTEGER REFERENCES users(id),
      deadline TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create past_papers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS past_papers (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_url VARCHAR(255),
      unit_code VARCHAR(20) REFERENCES units(code),
      user_id INTEGER REFERENCES users(id),
      year INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create completed_assignments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS completed_assignments (
      id SERIAL PRIMARY KEY,
      assignment_id INTEGER REFERENCES assignments(id),
      user_id INTEGER REFERENCES users(id),
      file_url VARCHAR(255),
      grade INTEGER,
      feedback TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (assignment_id, user_id)
    );
  `);
  
  // Create user_note_views table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_note_views (
      id SERIAL PRIMARY KEY,
      note_id INTEGER REFERENCES notes(id),
      user_id INTEGER REFERENCES users(id),
      viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (note_id, user_id)
    );
  `);
  
  // Create user_paper_views table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_paper_views (
      id SERIAL PRIMARY KEY,
      paper_id INTEGER REFERENCES past_papers(id),
      user_id INTEGER REFERENCES users(id),
      viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (paper_id, user_id)
    );
  `);
  
  // Create activity_logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      type VARCHAR(50) NOT NULL,
      description TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create search_queries table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS search_queries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      query VARCHAR(255) NOT NULL,
      result_count INTEGER DEFAULT 0,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create session table for express-session with pg
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    );
  `);
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);
  
  console.log('Tables created successfully.');
}

// Insert academic units
async function insertUnits() {
  console.log('Inserting academic units...');
  
  const units = [
    { code: 'MAT 2101', name: 'Mathematics for Computing', description: 'Fundamental mathematics concepts relevant to computing science.' },
    { code: 'MAT 2102', name: 'Discrete Mathematics', description: 'Mathematical structures that are fundamentally discrete in computer science.' },
    { code: 'STA 2101', name: 'Statistical Methods', description: 'Basic concepts of statistics and probability theory for data analysis.' },
    { code: 'DAT 2101', name: 'Database Systems', description: 'Introduction to database design, implementation and management.' },
    { code: 'DAT 2102', name: 'Data Structures and Algorithms', description: 'Fundamental data structures and algorithms used in computing.' },
    { code: 'HED 2101', name: 'Health Informatics', description: 'Application of information technology in healthcare.' }
  ];
  
  for (const unit of units) {
    // Check if unit already exists
    const exists = await pool.query('SELECT code FROM units WHERE code = $1', [unit.code]);
    
    if (exists.rows.length === 0) {
      await pool.query(
        'INSERT INTO units (code, name, description) VALUES ($1, $2, $3)',
        [unit.code, unit.name, unit.description]
      );
    }
  }
  
  console.log('Units inserted successfully.');
}

// Insert users (1 teacher, 48 students)
async function insertUsers() {
  console.log('Inserting users...');
  
  // Hash the default password
  const defaultPassword = await hashPassword('sds#website');
  
  // Insert teacher
  const teacherExists = await pool.query('SELECT id FROM users WHERE admission_number = $1', ['T001']);
  
  if (teacherExists.rows.length === 0) {
    await pool.query(
      'INSERT INTO users (name, admission_number, password, role) VALUES ($1, $2, $3, $4)',
      ['Teacher Account', 'T001', defaultPassword, 'teacher']
    );
  }
  
  // Insert students
  for (let i = 1; i <= 48; i++) {
    const admissionNumber = `S${i.toString().padStart(3, '0')}`;
    const studentExists = await pool.query('SELECT id FROM users WHERE admission_number = $1', [admissionNumber]);
    
    if (studentExists.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (name, admission_number, password, role) VALUES ($1, $2, $3, $4)',
        [`Student ${i}`, admissionNumber, defaultPassword, 'student']
      );
    }
  }
  
  console.log('Users inserted successfully.');
}

// Run the initialization
initDatabase();