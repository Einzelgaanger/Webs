/**
 * Simple Express server for Student Performance Tracker
 * This version doesn't rely on path-to-regexp which is causing issues
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const multer = require('multer');
const apiRouter = require('./api');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Server start time for uptime calculation
const SERVER_START_TIME = Date.now();

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware for profile image uploads
const profileStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const profileDir = path.join(UPLOADS_DIR, 'profiles');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    cb(null, profileDir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${Date.now()}${ext}`);
  }
});

const profileUpload = multer({ 
  storage: profileStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware for file uploads (assignments, notes, etc.)
const fileStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const fileDir = path.join(UPLOADS_DIR, 'files');
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    cb(null, fileDir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `file-${Date.now()}${ext}`);
  }
});

const fileUpload = multer({ 
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    // Accept common document formats
    if (!file.originalname.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|csv|zip|rar)$/)) {
      return cb(new Error('Only document files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Database connection
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
async function testDatabase() {
  try {
    const client = await dbPool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connection successful. Time:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
}

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Session configuration with PostgreSQL session store
const pgSession = require('connect-pg-simple')(session);
app.use(session({
  store: new pgSession({
    pool: dbPool,
    tableName: 'Session'
  }),
  secret: process.env.SESSION_SECRET || 'student_performance_tracker_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure passport local strategy
passport.use(new LocalStrategy({
  usernameField: 'admissionNumber',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, admissionNumber, password, done) => {
  try {
    const client = await dbPool.connect();
    const result = await client.query(
      'SELECT * FROM "User" WHERE "admissionNumber" = $1 AND "name" = $2',
      [admissionNumber, req.body.name]
    );
    
    client.release();
    
    if (result.rows.length === 0) {
      return done(null, false, { message: 'No user found with the given credentials' });
    }
    
    const user = result.rows[0];
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect password' });
    }
    
    return done(null, user);
  } catch (err) {
    console.error('Authentication error:', err);
    return done(err);
  }
}));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const client = await dbPool.connect();
    const result = await client.query('SELECT * FROM "User" WHERE id = $1', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return done(null, false);
    }
    
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

// Authentication middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}

// API Routes
app.use('/api', apiRouter);

// Login route
app.post('/api/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(401).json({ message: info.message || 'Authentication failed' });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login session error:', err);
        return res.status(500).json({ message: 'Error establishing session' });
      }
      
      // Return user info without password
      const userInfo = { ...user };
      delete userInfo.password;
      
      return res.json({ 
        message: 'Login successful',
        user: userInfo
      });
    });
  })(req, res, next);
});

// Logout route
app.post('/api/auth/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user route
app.get('/api/auth/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Return user info without password
  const userInfo = { ...req.user };
  delete userInfo.password;
  
  res.json(userInfo);
});

// Update password route
app.post('/api/auth/update-password', ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Get user from database
    const client = await dbPool.connect();
    const userResult = await client.query('SELECT * FROM "User" WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      client.release();
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password in database
    await client.query('UPDATE "User" SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    client.release();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update profile image route
app.post('/api/auth/update-profile-image', ensureAuthenticated, profileUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const imageUrl = `/uploads/profiles/${path.basename(req.file.path)}`;
    const userId = req.user.id;
    
    // Update profile image URL in database
    const client = await dbPool.connect();
    await client.query('UPDATE "User" SET "profileImageUrl" = $1 WHERE id = $2', [imageUrl, userId]);
    client.release();
    
    res.json({ 
      message: 'Profile image updated successfully',
      profileImageUrl: imageUrl
    });
  } catch (err) {
    console.error('Profile image update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Dashboard stats route
app.get('/api/dashboard/stats', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await dbPool.connect();
    
    // Get total units
    const unitsResult = await client.query(`
      SELECT COUNT(*) FROM "Unit"
    `);
    
    // Get completed assignments
    const completedAssignmentsResult = await client.query(`
      SELECT COUNT(*) FROM "Assignment" 
      WHERE "userId" = $1 AND "completedAt" IS NOT NULL
    `, [userId]);
    
    // Get pending assignments
    const pendingAssignmentsResult = await client.query(`
      SELECT COUNT(*) FROM "Assignment" 
      WHERE "userId" = $1 AND "completedAt" IS NULL
    `, [userId]);
    
    // Get notes count
    const notesResult = await client.query(`
      SELECT COUNT(*) FROM "Note" 
      WHERE "userId" = $1
    `, [userId]);
    
    // Get past papers count
    const pastPapersResult = await client.query(`
      SELECT COUNT(*) FROM "PastPaper" 
      WHERE "userId" = $1
    `, [userId]);
    
    client.release();
    
    res.json({
      totalUnits: parseInt(unitsResult.rows[0].count),
      completedAssignments: parseInt(completedAssignmentsResult.rows[0].count),
      pendingAssignments: parseInt(pendingAssignmentsResult.rows[0].count),
      notes: parseInt(notesResult.rows[0].count),
      pastPapers: parseInt(pastPapersResult.rows[0].count)
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user activities route
app.get('/api/dashboard/activities', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await dbPool.connect();
    
    // Get recent activities (completed assignments, viewed notes, viewed past papers)
    const activitiesResult = await client.query(`
      (
        SELECT 
          'assignment_completed' as type, 
          "completedAt" as timestamp,
          a.title as title,
          u.code as unitCode
        FROM "Assignment" a
        JOIN "Unit" u ON a."unitCode" = u.code
        WHERE a."userId" = $1 AND a."completedAt" IS NOT NULL
      )
      UNION ALL
      (
        SELECT 
          'note_viewed' as type, 
          n."lastViewedAt" as timestamp,
          n.title as title,
          u.code as unitCode
        FROM "Note" n
        JOIN "Unit" u ON n."unitCode" = u.code
        WHERE n."userId" = $1 AND n."lastViewedAt" IS NOT NULL
      )
      UNION ALL
      (
        SELECT 
          'past_paper_viewed' as type, 
          pp."lastViewedAt" as timestamp,
          pp.title as title,
          u.code as unitCode
        FROM "PastPaper" pp
        JOIN "Unit" u ON pp."unitCode" = u.code
        WHERE pp."userId" = $1 AND pp."lastViewedAt" IS NOT NULL
      )
      ORDER BY timestamp DESC
      LIMIT 10
    `, [userId]);
    
    client.release();
    
    res.json(activitiesResult.rows);
  } catch (err) {
    console.error('User activities error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get upcoming deadlines route
app.get('/api/dashboard/deadlines', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await dbPool.connect();
    
    // Get upcoming assignment deadlines
    const deadlinesResult = await client.query(`
      SELECT 
        a.id,
        a.title,
        a."dueDate",
        u.code as "unitCode",
        u.name as "unitName"
      FROM "Assignment" a
      JOIN "Unit" u ON a."unitCode" = u.code
      WHERE a."userId" = $1 
        AND a."completedAt" IS NULL 
        AND a."dueDate" > NOW()
      ORDER BY a."dueDate" ASC
      LIMIT 5
    `, [userId]);
    
    client.release();
    
    res.json(deadlinesResult.rows);
  } catch (err) {
    console.error('Upcoming deadlines error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all units route
app.get('/api/units', ensureAuthenticated, async (req, res) => {
  try {
    const client = await dbPool.connect();
    
    // Get all units
    const unitsResult = await client.query(`
      SELECT * FROM "Unit"
      ORDER BY code ASC
    `);
    
    client.release();
    
    res.json(unitsResult.rows);
  } catch (err) {
    console.error('Units fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Notes routes
app.get('/api/units/:unitCode/notes', ensureAuthenticated, async (req, res) => {
  try {
    const { unitCode } = req.params;
    const userId = req.user.id;
    
    const client = await dbPool.connect();
    
    // Get notes for the specified unit
    const notesResult = await client.query(`
      SELECT * FROM "Note"
      WHERE "unitCode" = $1 AND "userId" = $2
      ORDER BY "createdAt" DESC
    `, [unitCode, userId]);
    
    client.release();
    
    res.json(notesResult.rows);
  } catch (err) {
    console.error('Notes fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/units/:unitCode/notes', ensureAuthenticated, fileUpload.single('file'), async (req, res) => {
  try {
    const { unitCode } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Prepare file URL if uploaded
    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/files/${path.basename(req.file.path)}`;
    }
    
    const client = await dbPool.connect();
    
    // Insert note
    const noteResult = await client.query(`
      INSERT INTO "Note" ("title", "content", "fileUrl", "unitCode", "userId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [title, content || null, fileUrl, unitCode, userId]);
    
    client.release();
    
    res.status(201).json(noteResult.rows[0]);
  } catch (err) {
    console.error('Note creation error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/notes/:noteId', ensureAuthenticated, async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;
    
    const client = await dbPool.connect();
    
    // Delete note
    const deleteResult = await client.query(`
      DELETE FROM "Note"
      WHERE id = $1 AND "userId" = $2
      RETURNING *
    `, [noteId, userId]);
    
    client.release();
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found or not owned by user' });
    }
    
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Note deletion error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/notes/:noteId/view', ensureAuthenticated, async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;
    
    const client = await dbPool.connect();
    
    // Update last viewed timestamp
    await client.query(`
      UPDATE "Note"
      SET "lastViewedAt" = NOW()
      WHERE id = $1 AND "userId" = $2
    `, [noteId, userId]);
    
    client.release();
    
    res.json({ message: 'Note marked as viewed' });
  } catch (err) {
    console.error('Note view marking error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Assignment routes
app.get('/api/units/:unitCode/assignments', ensureAuthenticated, async (req, res) => {
  try {
    const { unitCode } = req.params;
    const userId = req.user.id;
    
    const client = await dbPool.connect();
    
    // Get assignments for the specified unit
    const assignmentsResult = await client.query(`
      SELECT * FROM "Assignment"
      WHERE "unitCode" = $1 AND "userId" = $2
      ORDER BY "dueDate" ASC
    `, [unitCode, userId]);
    
    client.release();
    
    res.json(assignmentsResult.rows);
  } catch (err) {
    console.error('Assignments fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/units/:unitCode/assignments', ensureAuthenticated, fileUpload.single('file'), async (req, res) => {
  try {
    const { unitCode } = req.params;
    const { title, description, dueDate } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Title and due date are required' });
    }
    
    // Prepare file URL if uploaded
    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/files/${path.basename(req.file.path)}`;
    }
    
    const client = await dbPool.connect();
    
    // Insert assignment
    const assignmentResult = await client.query(`
      INSERT INTO "Assignment" ("title", "description", "fileUrl", "dueDate", "unitCode", "userId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [title, description || null, fileUrl, dueDate, unitCode, userId]);
    
    client.release();
    
    res.status(201).json(assignmentResult.rows[0]);
  } catch (err) {
    console.error('Assignment creation error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/assignments/:assignmentId', ensureAuthenticated, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    
    const client = await dbPool.connect();
    
    // Delete assignment
    const deleteResult = await client.query(`
      DELETE FROM "Assignment"
      WHERE id = $1 AND "userId" = $2
      RETURNING *
    `, [assignmentId, userId]);
    
    client.release();
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found or not owned by user' });
    }
    
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('Assignment deletion error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/assignments/:assignmentId/complete', ensureAuthenticated, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    
    const client = await dbPool.connect();
    
    // Mark assignment as completed
    const completeResult = await client.query(`
      UPDATE "Assignment"
      SET "completedAt" = NOW()
      WHERE id = $1 AND "userId" = $2
      RETURNING *
    `, [assignmentId, userId]);
    
    if (completeResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Assignment not found or not owned by user' });
    }
    
    // Update user rank
    await client.query(`
      UPDATE "User"
      SET rank = COALESCE(rank, 0) + 10
      WHERE id = $1
    `, [userId]);
    
    client.release();
    
    res.json({ 
      message: 'Assignment marked as completed',
      assignment: completeResult.rows[0]
    });
  } catch (err) {
    console.error('Assignment completion error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Past papers routes
app.get('/api/units/:unitCode/past-papers', ensureAuthenticated, async (req, res) => {
  try {
    const { unitCode } = req.params;
    const userId = req.user.id;
    
    const client = await dbPool.connect();
    
    // Get past papers for the specified unit
    const papersResult = await client.query(`
      SELECT * FROM "PastPaper"
      WHERE "unitCode" = $1 AND "userId" = $2
      ORDER BY "year" DESC
    `, [unitCode, userId]);
    
    client.release();
    
    res.json(papersResult.rows);
  } catch (err) {
    console.error('Past papers fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/units/:unitCode/past-papers', ensureAuthenticated, fileUpload.single('file'), async (req, res) => {
  try {
    const { unitCode } = req.params;
    const { title, description, year } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!title || !year) {
      return res.status(400).json({ message: 'Title and year are required' });
    }
    
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ message: 'File upload is required for past papers' });
    }
    
    const fileUrl = `/uploads/files/${path.basename(req.file.path)}`;
    
    const client = await dbPool.connect();
    
    // Insert past paper
    const paperResult = await client.query(`
      INSERT INTO "PastPaper" ("title", "description", "fileUrl", "year", "unitCode", "userId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [title, description || null, fileUrl, year, unitCode, userId]);
    
    client.release();
    
    res.status(201).json(paperResult.rows[0]);
  } catch (err) {
    console.error('Past paper creation error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/past-papers/:paperId', ensureAuthenticated, async (req, res) => {
  try {
    const { paperId } = req.params;
    const userId = req.user.id;
    
    const client = await dbPool.connect();
    
    // Delete past paper
    const deleteResult = await client.query(`
      DELETE FROM "PastPaper"
      WHERE id = $1 AND "userId" = $2
      RETURNING *
    `, [paperId, userId]);
    
    client.release();
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Past paper not found or not owned by user' });
    }
    
    res.json({ message: 'Past paper deleted successfully' });
  } catch (err) {
    console.error('Past paper deletion error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/past-papers/:paperId/view', ensureAuthenticated, async (req, res) => {
  try {
    const { paperId } = req.params;
    const userId = req.user.id;
    
    const client = await dbPool.connect();
    
    // Update last viewed timestamp
    await client.query(`
      UPDATE "PastPaper"
      SET "lastViewedAt" = NOW()
      WHERE id = $1 AND "userId" = $2
    `, [paperId, userId]);
    
    client.release();
    
    res.json({ message: 'Past paper marked as viewed' });
  } catch (err) {
    console.error('Past paper view marking error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unit rankings route
app.get('/api/units/:unitCode/rankings', ensureAuthenticated, async (req, res) => {
  try {
    const { unitCode } = req.params;
    
    const client = await dbPool.connect();
    
    // Get user rankings for the unit
    const rankingsResult = await client.query(`
      SELECT 
        u.id,
        u.name,
        u."admissionNumber",
        u."profileImageUrl",
        u.rank,
        COUNT(DISTINCT a.id) FILTER (WHERE a."completedAt" IS NOT NULL) as "completedAssignments",
        COUNT(DISTINCT n.id) as "totalNotes"
      FROM "User" u
      LEFT JOIN "Assignment" a ON u.id = a."userId" AND a."unitCode" = $1
      LEFT JOIN "Note" n ON u.id = n."userId" AND n."unitCode" = $1
      GROUP BY u.id
      ORDER BY u.rank DESC NULLS LAST, "completedAssignments" DESC
      LIMIT 10
    `, [unitCode]);
    
    client.release();
    
    res.json(rankingsResult.rows);
  } catch (err) {
    console.error('Rankings fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Always serve the index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
async function startApp() {
  // Test database connection
  const dbConnected = await testDatabase();
  
  if (!dbConnected) {
    console.warn('WARNING: Database connection failed. Some features may not work.');
  }
  
  // Start the server
  app.listen(PORT, HOST, () => {
    console.log(`Student Performance Tracker is running on http://${HOST}:${PORT}`);
  });
}

// Start the application
startApp().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});