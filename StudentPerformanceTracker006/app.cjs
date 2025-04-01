/**
 * Student Performance Tracker Application
 * 
 * This is the main application file that starts the server
 * and provides the API endpoints for the Student Performance Tracker.
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Configure session middleware with PostgreSQL store
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session'
  }),
  secret: process.env.SERVICE_KEY || 'sds-maverick-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Uploads directory setup
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PROFILES_DIR = path.join(UPLOADS_DIR, 'profiles');
const FILES_DIR = path.join(UPLOADS_DIR, 'files');

// Ensure directories exist
[UPLOADS_DIR, PROFILES_DIR, FILES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isProfile = req.originalUrl.includes('/profile') || req.originalUrl.includes('/auth/register');
    cb(null, isProfile ? PROFILES_DIR : FILES_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, documents
  const acceptedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];
  
  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and office documents are allowed.'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve static files from the dist directory 
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'client', 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const authenticate = (req, res, next) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Student Performance Tracker API is running' });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Get user from database - try exact match first
    let result = await pool.query(
      'SELECT * FROM users WHERE admission_number = $1',
      [username]
    );

    // If no exact match, try case-insensitive match
    if (result.rows.length === 0) {
      result = await pool.query(
        'SELECT * FROM users WHERE LOWER(admission_number) = LOWER($1)',
        [username]
      );
    }

    // If still no match, try name
    if (result.rows.length === 0) {
      result = await pool.query(
        'SELECT * FROM users WHERE LOWER(name) = LOWER($1)',
        [username]
      );
    }

    // Last resort: fuzzy matching on admission_number or name
    if (result.rows.length === 0) {
      result = await pool.query(
        'SELECT * FROM users WHERE admission_number ILIKE $1 OR name ILIKE $1',
        [`%${username}%`]
      );
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Special case for default password "sds#website"
    if (password === 'sds#website') {
      // Check if the stored hash is for "sds#website"
      const parts = user.password.split('.');
      const salt = parts[1];
      const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
      const hash = `${derivedKey}.${salt}`;
      
      if (hash !== user.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      // Regular password verification
      const parts = user.password.split('.');
      const salt = parts[1];
      const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
      const hash = `${derivedKey}.${salt}`;
      
      if (hash !== user.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Set session data
    req.session.isAuthenticated = true;
    req.session.user = {
      id: user.id,
      name: user.name,
      admissionNumber: user.admission_number,
      role: user.role,
      profileImageUrl: user.profile_image_url
    };

    // Log login activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, type, description) VALUES ($1, $2, $3)',
      [user.id, 'login', 'User logged in']
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        admissionNumber: user.admission_number,
        role: user.role,
        profileImageUrl: user.profile_image_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Password reset request
app.post('/api/auth/reset-request', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE admission_number = $1 OR name = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Store token in session (in a real app, this would be in the database)
    req.session.resetToken = resetToken;
    req.session.resetTokenExpiry = resetTokenExpiry;
    req.session.resetUserId = result.rows[0].id;
    
    res.json({ 
      message: 'Password reset requested',
      resetToken
    });
  } catch (error) {
    console.error('Reset request error:', error);
    res.status(500).json({ message: 'Server error during reset request' });
  }
});

// Password reset confirmation
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, serviceKey, newPassword } = req.body;
    
    if (!token || !serviceKey || !newPassword) {
      return res.status(400).json({ message: 'Token, service key and new password are required' });
    }
    
    // Verify service key
    const correctServiceKey = process.env.SERVICE_KEY || 'sds-maverick-2024';
    if (serviceKey !== correctServiceKey) {
      return res.status(401).json({ message: 'Invalid service key' });
    }
    
    // Verify token
    if (!req.session.resetToken || 
        req.session.resetToken !== token || 
        !req.session.resetTokenExpiry || 
        req.session.resetTokenExpiry < Date.now()) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }
    
    const userId = req.session.resetUserId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in session' });
    }
    
    // Hash new password
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(newPassword, salt, 64).toString('hex');
    const hash = `${derivedKey}.${salt}`;
    
    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hash, userId]
    );
    
    // Clear reset token
    delete req.session.resetToken;
    delete req.session.resetTokenExpiry;
    delete req.session.resetUserId;
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// Search routes
app.get('/api/search', authenticate, async (req, res) => {
  try {
    const { query, unitCode, contentType, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Basic sanitization
    const searchTerm = query.replace(/[^\w\s]/gi, '').trim();
    if (!searchTerm) {
      return res.json({ results: [] });
    }
    
    // Build search conditions
    const unitCondition = unitCode ? `AND unit_code = '${unitCode}'` : '';
    
    // Build search patterns for SQL LIKE
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    
    let results = [];
    
    // Search in notes
    if (!contentType || contentType === 'notes') {
      const notesQuery = `
        SELECT 
          id, 
          title, 
          description, 
          file_url, 
          unit_code AS "unitCode", 
          user_id AS "userId", 
          created_at AS "createdAt",
          'note' AS type
        FROM 
          notes 
        WHERE 
          (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1)
          ${unitCondition}
        ORDER BY 
          created_at DESC
        LIMIT $2
      `;
      
      const notesResult = await pool.query(notesQuery, [searchPattern, limit]);
      results = [...results, ...notesResult.rows];
    }
    
    // Search in assignments
    if (!contentType || contentType === 'assignments') {
      const assignmentsQuery = `
        SELECT 
          id, 
          title, 
          description, 
          file_url, 
          unit_code AS "unitCode", 
          user_id AS "userId", 
          deadline,
          created_at AS "createdAt",
          'assignment' AS type
        FROM 
          assignments 
        WHERE 
          (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1)
          ${unitCondition}
        ORDER BY 
          deadline ASC
        LIMIT $2
      `;
      
      const assignmentsResult = await pool.query(assignmentsQuery, [searchPattern, limit]);
      results = [...results, ...assignmentsResult.rows];
    }
    
    // Search in past papers
    if (!contentType || contentType === 'papers') {
      const papersQuery = `
        SELECT 
          id, 
          title, 
          description, 
          file_url, 
          unit_code AS "unitCode", 
          user_id AS "userId", 
          year,
          created_at AS "createdAt",
          'paper' AS type
        FROM 
          past_papers 
        WHERE 
          (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1)
          ${unitCondition}
        ORDER BY 
          year DESC
        LIMIT $2
      `;
      
      const papersResult = await pool.query(papersQuery, [searchPattern, limit]);
      results = [...results, ...papersResult.rows];
    }
    
    // Record the search
    await pool.query(
      'INSERT INTO search_queries (user_id, query, result_count) VALUES ($1, $2, $3)',
      [req.session.user.id, query, results.length]
    );
    
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// Get search suggestions
app.get('/api/search/suggestions', authenticate, async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }
    
    const searchPattern = `${query.toLowerCase()}%`;
    
    const suggestionsQuery = `
      SELECT 
        query 
      FROM 
        search_queries 
      WHERE 
        LOWER(query) LIKE $1
      GROUP BY 
        query
      ORDER BY 
        COUNT(id) DESC
      LIMIT $2
    `;
    
    const result = await pool.query(suggestionsQuery, [searchPattern, limit]);
    const suggestions = result.rows.map(row => row.query);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Server error getting search suggestions' });
  }
});

// Get trending searches
app.get('/api/search/trending', authenticate, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const trendingQuery = `
      SELECT 
        query 
      FROM 
        search_queries 
      WHERE 
        timestamp > NOW() - INTERVAL '7 days'
      GROUP BY 
        query
      ORDER BY 
        COUNT(id) DESC
      LIMIT $1
    `;
    
    const result = await pool.query(trendingQuery, [limit]);
    const trending = result.rows.map(row => row.query);
    
    res.json({ trending });
  } catch (error) {
    console.error('Trending searches error:', error);
    res.status(500).json({ message: 'Server error getting trending searches' });
  }
});

// Initialization - check database and create if needed
async function initializeApp() {
  try {
    // Check if the database has the required tables
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!result.rows[0].exists) {
      console.log('Database tables not found. Running initialization script...');
      // Run initialization script
      require('./init-database.cjs');
    } else {
      console.log('Database tables found. Ready to serve requests.');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Serve client app for all other routes (important - this must be after API routes)
app.get('*', (req, res) => {
  // Skip API paths
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Serve index.html for all other routes
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Student Performance Tracker running on port ${PORT}`);
  await initializeApp();
});