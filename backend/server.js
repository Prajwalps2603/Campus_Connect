const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const cookieParser = require('cookie-parser');
// Rate limiting
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);
app.use(cookieParser());
const PORT = process.env.PORT || 8000;

// Middleware
// Allow credentials and Authorization header for API routes (needed for multipart/form-data with Bearer token)
app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','X-Refresh-Token'],
  credentials: true,
  maxAge: 600
}));
// Parse JSON bodies for application/json requests
app.use(express.json());

// Ensure preflight requests to API routes are handled and don't return 405
app.options('/api/*', (req, res) => {
  res.sendStatus(204);
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve frontend static assets so pages and uploaded media work under same origin
app.use(express.static(path.join(__dirname, '..', 'Frontend')));

// Convenience: root redirect to feed (adjust if you want landing page)
app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'feed.html'));
});

// PostgreSQL connection (environment-driven with fallbacks)
// Prefer lowercase/underscore DB name to avoid quoting issues; adjust .env if needed.
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'campus_connect',
  password: process.env.DB_PASSWORD || 'postgres',
  port: Number(process.env.DB_PORT) || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('✅ Connected to PostgreSQL database:', process.env.DB_NAME || 'campus_connect');
  release();
});

// Create users table if not exists
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool.query(createTableQuery, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('✅ Users table ready');
    // Ensure case-insensitive unique indexes for email & username
    const uniqueIdxQueries = [
      "CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email))",
      "CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username))"
    ];
    uniqueIdxQueries.forEach(q => {
      pool.query(q).catch(e => console.warn('Index creation warning:', e.message));
    });
    // Make sure is_private column exists (for deployments that had an older users table)
    pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE')
      .catch(e => console.warn('Add is_private warn:', e.message));
    // Ensure role column exists
    pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'student'")
      .catch(e => console.warn('Add role warn:', e.message));
  }
});

// Create posts table if not exists
const createPostsTable = `
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  caption TEXT,
  media_url TEXT,
  media_type VARCHAR(20),
  filter VARCHAR(40),
  stickers JSONB,
  crop JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
pool.query(createPostsTable).then(()=> console.log('✅ Posts table ready')).catch(e=> console.error('Posts table error', e));

// Create follows table (follower relationships)
const createFollowsTable = `
CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('requested','accepted')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id)
);`;
pool.query(createFollowsTable)
  .then(()=> Promise.all([
    pool.query('CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)'),
    pool.query('CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)')
  ])).then(()=> console.log('✅ Follows table ready'))
  .catch(e=> console.error('Follows table error', e));

// Notifications table
const createNotificationsTable = `
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
pool.query(createNotificationsTable)
  .then(()=> Promise.all([
    pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications(receiver_id, is_read, created_at DESC)')
  ])).then(async ()=> {
    // Evolve schema: add type/status for richer notification flows
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50)");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'");
    console.log('✅ Notifications table ready');
  })
  .catch(e=> console.error('Notifications table error', e));

// Create institutions table if not exists (for college accounts)
const createInstitutionsTable = `
CREATE TABLE IF NOT EXISTS institutions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  type VARCHAR(120),
  established_year INT,
  logo_url TEXT,
  address TEXT,
  city VARCHAR(120),
  state VARCHAR(120),
  country VARCHAR(120),
  zip VARCHAR(20),
  phone VARCHAR(40),
  email VARCHAR(160), -- official institute email
  website VARCHAR(255),
  head VARCHAR(160),
  contact_name VARCHAR(160),
  contact_position VARCHAR(120),
  contact_email VARCHAR(160),
  contact_phone VARCHAR(40),
  login_email VARCHAR(160) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  affiliations TEXT,
  description TEXT,
  courses JSONB,            -- array of {name, level, duration}
  documents JSONB,          -- array of {file, originalName, size, mime}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
pool.query(createInstitutionsTable)
  .then(()=> console.log('✅ Institutions table ready'))
  .catch(e=> console.error('Institutions table error', e));
pool.query('CREATE UNIQUE INDEX IF NOT EXISTS institutions_login_email_lower_idx ON institutions (LOWER(login_email))')
  .catch(e=> console.warn('Institutions idx warn', e.message));

// Create notes table if not exists
const createNotesTable = `
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  subject VARCHAR(100),
  course_code VARCHAR(50),
  scheme VARCHAR(10),
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
pool.query(createNotesTable)
  .then(()=> console.log('✅ Notes table ready'))
  .catch(e=> console.error('Notes table error', e));

// Create projects table if not exists
const createProjectsTable = `
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  technology VARCHAR(100),
  completion_percentage INTEGER DEFAULT 0,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
pool.query(createProjectsTable)
  .then(()=> console.log('✅ Projects table ready'))
  .catch(e=> console.error('Projects table error', e));

// Create refresh tokens table for token rotation
const createRefreshTokensTable = `
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token VARCHAR(200) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
pool.query(createRefreshTokensTable).then(()=> console.log('✅ Refresh tokens table ready')).catch(e=> console.error('Refresh tokens table error', e));

// Enhanced models: tags, resource_tags, comments, ratings, versions, groups, bookmarks
const createTagsTable = `
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
const createResourceTagsTable = `
CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id INTEGER NOT NULL,
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('note','project')),
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, resource_type, tag_id)
);`;
const createCommentsTable = `
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL,
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('note','project','post')),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
const createRatingsTable = `
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL,
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('note','project','post')),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (resource_id, resource_type, user_id)
);`;
const createVersionsTable = `
CREATE TABLE IF NOT EXISTS versions (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL,
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('note','project')),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
const createGroupsTable = `
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
const createGroupMembersTable = `
CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(40) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);`;
const createBookmarksTable = `
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  resource_id INTEGER NOT NULL,
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('note','project','post')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, resource_id, resource_type)
);`;

Promise.all([
  pool.query(createTagsTable),
  pool.query(createResourceTagsTable),
  pool.query(createCommentsTable),
  pool.query(createRatingsTable),
  pool.query(createVersionsTable),
  pool.query(createGroupsTable),
  pool.query(createGroupMembersTable),
  pool.query(createBookmarksTable)
]).then(()=> {
  console.log('✅ Enhanced models (tags/comments/ratings/versions/groups/bookmarks) ready');

  // Indexes for optimization
  pool.query("CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);")
    .catch(e=>console.warn('idx_notes_created_at warn', e.message));
  pool.query("CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);")
    .catch(e=>console.warn('idx_projects_created_at warn', e.message));

  // Full-text search indexes for notes & projects
  pool.query("ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_vector tsvector;")
    .catch(()=>{});
  pool.query("UPDATE notes SET search_vector = to_tsvector(coalesce(title,'') || ' ' || coalesce(content,''));")
    .catch(()=>{});
  pool.query("CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING GIN(search_vector);")
    .catch(e=>console.warn('idx_notes_search warn', e.message));

  pool.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS search_vector tsvector;")
    .catch(()=>{});
  pool.query("UPDATE projects SET search_vector = to_tsvector(coalesce(title,'') || ' ' || coalesce(description,''));")
    .catch(()=>{});
  pool.query("CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING GIN(search_vector);")
    .catch(e=>console.warn('idx_projects_search warn', e.message));

  // Indexes for tags and lookup
  pool.query("CREATE INDEX IF NOT EXISTS idx_resource_tags_tag_id ON resource_tags(tag_id);")
    .catch(()=>{});
  pool.query("CREATE INDEX IF NOT EXISTS idx_comments_resource ON comments(resource_type, resource_id, created_at DESC);")
    .catch(()=>{});
  pool.query("CREATE INDEX IF NOT EXISTS idx_ratings_resource ON ratings(resource_type, resource_id);")
    .catch(()=>{});

}).catch(e=> console.error('Enhanced models creation error', e));

// Create trigger function to maintain tsvector columns on notes/projects
const createFtsTriggerFunction = `
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'notes' THEN
    NEW.search_vector := to_tsvector(coalesce(NEW.title,'') || ' ' || coalesce(NEW.content,''));
    RETURN NEW;
  ELSIF TG_TABLE_NAME = 'projects' THEN
    NEW.search_vector := to_tsvector(coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,''));
    RETURN NEW;
  END IF;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;`;

pool.query(createFtsTriggerFunction).then(()=>{
  // Attach triggers
  pool.query("DROP TRIGGER IF EXISTS notes_search_vector_update ON notes;")
    .catch(()=>{});
  pool.query("CREATE TRIGGER notes_search_vector_update BEFORE INSERT OR UPDATE ON notes FOR EACH ROW EXECUTE PROCEDURE update_search_vector();")
    .catch(()=>{});

  pool.query("DROP TRIGGER IF EXISTS projects_search_vector_update ON projects;")
    .catch(()=>{});
  pool.query("CREATE TRIGGER projects_search_vector_update BEFORE INSERT OR UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_search_vector();")
    .catch(()=>{});

  // Additional indexes for optimization
  pool.query("CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);")
    .catch(()=>{});
  pool.query("CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);")
    .catch(()=>{});
  pool.query("CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(LOWER(name));")
    .catch(()=>{});
  console.log('✅ FTS trigger and additional indexes created (best-effort)');
}).catch(e=>console.warn('FTS trigger creation warn', e.message));

// Simple storage folder
const uploadDir = path.join(__dirname, 'uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req,file,cb)=> cb(null, uploadDir),
  filename: (req,file,cb)=>{
    const unique = Date.now() + '_' + Math.random().toString(36).slice(2,8);
    const ext = path.extname(file.originalname)||'';
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

function authRequired(req, res, next){
  const auth = req.headers.authorization;
  if(!auth?.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'Auth required'});
  try {
    const token = auth.slice(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_fallback_secret_change_me');
    req.user = decoded; return next();
  } catch {
    return res.status(401).json({ success:false, message:'Invalid token'});
  }
}

// Role-based access control helper
function requireRole(role){
  return (req, res, next) => {
    const user = req.user;
    if(!user) return res.status(401).json({ success:false, message:'Auth required' });
    if(user.role === 'admin') return next(); // admins bypass
    if(Array.isArray(role)){
      if(role.includes(user.role)) return next();
    } else {
      if(user.role === role) return next();
    }
    return res.status(403).json({ success:false, message:'Insufficient role' });
  };
}

// make helper available for route modules
app.requireRole = requireRole;

// Optional auth decoder (does not reject on missing/invalid token)
function decodeAuth(req){
  const auth = req.headers.authorization;
  if(!auth?.startsWith('Bearer ')) return null;
  try {
    const token = auth.slice(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_fallback_secret_change_me');
    return decoded;
  } catch { return null; }
}

async function userCanViewTarget(viewerId, targetId){
  if(!targetId) return false;
  if(viewerId && Number(viewerId) === Number(targetId)) return true;
  const targetRow = await pool.query('SELECT is_private FROM users WHERE id=$1',[targetId]);
  if(!targetRow.rows.length) return false;
  const isPrivate = !!targetRow.rows[0].is_private;
  if(!isPrivate) return true; // public
  if(!viewerId) return false; // private requires auth + follow
  const rel = await pool.query('SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2 AND status=\'accepted\'',[viewerId, targetId]);
  return !!rel.rows.length;
}

// Create post endpoint
app.post('/api/posts', authRequired, upload.single('media'), async (req,res)=>{
  try {
    const { caption, filter, stickers, crop } = req.body;
    const media = req.file;
    if(!media) return res.status(400).json({ success:false, message:'Media file required' });
    const mediaUrl = '/uploads/' + media.filename;
    const type = media.mimetype.startsWith('video/') ? 'video' : 'image';
    const stickersJson = stickers ? JSON.parse(stickers || '[]') : [];
    const cropJson = crop ? JSON.parse(crop || 'null') : null;
    const inserted = await pool.query(`INSERT INTO posts (user_id, caption, media_url, media_type, filter, stickers, crop) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, user_id, caption, media_url, media_type, filter, stickers, crop, created_at`,[
      req.user.id, caption||'', mediaUrl, type, filter||null, JSON.stringify(stickersJson), cropJson ? JSON.stringify(cropJson) : null
    ]);
    const post = inserted.rows[0];
    const userRow = await pool.query('SELECT username FROM users WHERE id=$1',[req.user.id]);
    post.username = userRow.rows[0]?.username || 'user';
    res.json({ success:true, post });
  } catch(err){
    console.error('Create post error', err);
    res.status(500).json({ success:false, message:'Failed to create post'});
  }
});

// Upload note
app.post('/api/notes', authRequired, upload.single('file'), async (req, res) => {
  try {
    const { title, content, subject, course_code, scheme } = req.body;
    const file = req.file;
    const file_url = file ? '/uploads/' + file.filename : null;
    const inserted = await pool.query(`INSERT INTO notes (user_id, title, content, subject, course_code, scheme, file_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [
      req.user.id, title, content, subject, course_code, scheme, file_url
    ]);
    res.json({ success: true, note: inserted.rows[0] });
  } catch (err) {
    console.error('Create note error', err);
    res.status(500).json({ success: false, message: 'Failed to create note' });
  }
});

// Upload project
app.post('/api/projects', authRequired, upload.single('file'), async (req, res) => {
  try {
    const { title, description, technology, completion_percentage } = req.body;
    const file = req.file;
    const file_url = file ? '/uploads/' + file.filename : null;
    const inserted = await pool.query(`INSERT INTO projects (user_id, title, description, technology, completion_percentage, file_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [
      req.user.id, title, description, technology, completion_percentage || 0, file_url
    ]);
    res.json({ success: true, project: inserted.rows[0] });
  } catch (err) {
    console.error('Create project error', err);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
});

// GET notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await pool.query('SELECT n.*, u.username FROM notes n JOIN users u ON n.user_id = u.id ORDER BY n.created_at DESC');
    res.json({ success: true, notes: notes.rows });
  } catch (err) {
    console.error('Get notes error', err);
    res.status(500).json({ success: false, message: 'Failed to get notes' });
  }
});

// GET projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await pool.query('SELECT p.*, u.username FROM projects p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC');
    res.json({ success: true, projects: projects.rows });
  } catch (err) {
    console.error('Get projects error', err);
    res.status(500).json({ success: false, message: 'Failed to get projects' });
  }
});

// College / Institute signup endpoint
app.post('/api/institutions/signup', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'docs', maxCount: 10 }
]), async (req,res)=>{
  try {
    const body = req.body;
    let {
      name, instType, year, address, city, state, country, zip,
      phone, email, website, head, contactName, contactPosition,
      contactEmail, contactPhone, loginEmail, password, affiliations,
      description, courses: coursesJson
    } = body;

    // Basic validations
    if(!(name && loginEmail && password)){
      return res.status(422).json({ success:false, message:'Name, login email and password are required.' });
    }
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if(!emailRegex.test(loginEmail)){
      return res.status(422).json({ success:false, message:'Invalid login email format.' });
    }
    if(password.length < 6){
      return res.status(422).json({ success:false, message:'Password must be at least 6 characters.' });
    }
    // Check uniqueness
    const exists = await pool.query('SELECT 1 FROM institutions WHERE LOWER(login_email)=LOWER($1)', [loginEmail]);
    if(exists.rows.length){
      return res.status(409).json({ success:false, message:'Institute with this login email already exists.' });
    }
    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Files
    const logoFile = req.files?.logo?.[0];
    const docsFiles = req.files?.docs || [];
    const logoUrl = logoFile ? ('/uploads/' + logoFile.filename) : null;
    const documentsMeta = docsFiles.map(f=> ({ file: '/uploads/' + f.filename, originalName: f.originalname, size: f.size, mime: f.mimetype }));

    // Parse courses JSON (stringified array)
    let courses = [];
    if(coursesJson){
      try { courses = JSON.parse(coursesJson); } catch { courses = []; }
    }

    const inserted = await pool.query(`
      INSERT INTO institutions (
        name, type, established_year, logo_url, address, city, state, country, zip,
        phone, email, website, head, contact_name, contact_position, contact_email, contact_phone,
        login_email, password, affiliations, description, courses, documents
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17,
        $18,$19,$20,$21,$22,$23
      ) RETURNING id, name, type, logo_url, login_email, created_at;
    `,[
      name, instType || null, year||null, logoUrl, address||null, city||null, state||null, country||null, zip||null,
      phone||null, email||null, website||null, head||null, contactName||null, contactPosition||null, contactEmail||null, contactPhone||null,
      loginEmail, hashed, affiliations||null, description||null, JSON.stringify(courses||[]), JSON.stringify(documentsMeta)
    ]);
    const institution = inserted.rows[0];

    // Derive a username-like slug for compatibility with existing feed logic
    let slugBase = (institution.name || 'institution')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'_')
      // trim leading/trailing underscores
  .replace(/^_+/, '')
  .replace(/_+$/, '');
    if(!slugBase) slugBase='institution';
    institution.username = slugBase;
    institution.accountType = 'institution';

    // Sign token (reuse existing user token pattern)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: institution.id, username: institution.username, institution:true }, process.env.JWT_SECRET || 'dev_fallback_secret_change_me', { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });

    res.json({ success:true, message:'Institution account created', token, institution });
  } catch(err){
    console.error('Institution signup error', err);
    res.status(500).json({ success:false, message:'Failed to create institution account'});
  }
});

// Institution login endpoint
app.post('/api/institutions/login', async (req,res)=>{
  try {
    const { loginEmail, password } = req.body;
    if(!(loginEmail && password)){
      return res.status(422).json({ success:false, message:'Email and password required.' });
    }
    const result = await pool.query('SELECT * FROM institutions WHERE LOWER(login_email)=LOWER($1)', [loginEmail]);
    if(!result.rows.length){
      return res.status(401).json({ success:false, message:'Invalid credentials.' });
    }
    const inst = result.rows[0];
    const match = await bcrypt.compare(password, inst.password);
    if(!match){
      return res.status(401).json({ success:false, message:'Invalid credentials.' });
    }
    const jwt = require('jsonwebtoken');
    let slugBase = (inst.name || 'institution').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+/,'').replace(/_+$/,'');
    if(!slugBase) slugBase='institution';
    const token = jwt.sign({ id: inst.id, username: slugBase, institution:true }, process.env.JWT_SECRET || 'dev_fallback_secret_change_me', { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
    return res.json({ success:true, message:'Login successful', token, institution:{ id:inst.id, name:inst.name, username:slugBase, logo_url:inst.logo_url, accountType:'institution' } });
  } catch(err){
    console.error('Institution login error', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

// List latest posts
app.get('/api/posts', async (req,res)=>{
  try {
    const { limit=20 } = req.query;
    const viewer = decodeAuth(req);
    const lim = Math.min(Number(limit)||20,100);
    if(viewer?.id){
      // Public posts or by viewer or from accounts viewer follows (accepted)
      const rows = await pool.query(`
        SELECT p.*, u.username FROM posts p
        JOIN users u ON p.user_id=u.id
        WHERE (u.is_private = FALSE)
           OR (p.user_id = $1)
           OR (p.user_id IN (SELECT following_id FROM follows WHERE follower_id=$1 AND status='accepted'))
        ORDER BY p.id DESC LIMIT $2`, [viewer.id, lim]);
      return res.json({ success:true, posts: rows.rows });
    } else {
      const rows = await pool.query(`SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id=u.id WHERE u.is_private = FALSE ORDER BY p.id DESC LIMIT $1`, [lim]);
      return res.json({ success:true, posts: rows.rows });
    }
  } catch(err){
    console.error('List posts error', err);
    res.status(500).json({ success:false, message:'Failed to list posts'});
  }
});

// List posts by user (profile)
app.get('/api/users/:id/posts', async (req,res)=>{
  try {
    const { id } = req.params;
    const viewer = decodeAuth(req);
    const canView = await userCanViewTarget(viewer?.id, id);
    if(!canView){
      return res.status(403).json({ success:false, message:'This account is private. Follow to see posts.' });
    }
    const rows = await pool.query(`SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id=u.id WHERE user_id=$1 ORDER BY p.id DESC`, [id]);
    res.json({ success:true, posts: rows.rows });
  } catch(err){
    console.error('User posts error', err);
    res.status(500).json({ success:false, message:'Failed to list user posts'});
  }
});

// User stats: posts count, followers count, following count
app.get('/api/users/:id/stats', async (req,res)=>{
  try {
    const { id } = req.params;
    const [{ rows: pRows }, { rows: folRows }, { rows: ingRows }] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS posts FROM posts WHERE user_id=$1', [id]),
      pool.query("SELECT COUNT(*)::int AS followers FROM follows WHERE following_id=$1 AND status='accepted'", [id]),
      pool.query("SELECT COUNT(*)::int AS following FROM follows WHERE follower_id=$1 AND status='accepted'", [id])
    ]);
    const stats = {
      posts: pRows[0]?.posts || 0,
      followers: folRows[0]?.followers || 0,
      following: ingRows[0]?.following || 0
    };
    res.json({ success:true, stats });
  } catch(err){
    console.error('User stats error', err);
    res.status(500).json({ success:false, message:'Failed to get user stats' });
  }
});

// Follow: request or follow
app.post('/api/follow/:id', authRequired, async (req,res)=>{
  try {
    const targetId = Number(req.params.id);
    if(!targetId || targetId === req.user.id) return res.status(400).json({ success:false, message:'Invalid follow target' });
    const t = await pool.query('SELECT is_private FROM users WHERE id=$1',[targetId]);
    if(!t.rows.length) return res.status(404).json({ success:false, message:'User not found' });
    const isPrivate = !!t.rows[0].is_private;
    const existing = await pool.query('SELECT status FROM follows WHERE follower_id=$1 AND following_id=$2',[req.user.id, targetId]);
    if(existing.rows.length){
      return res.json({ success:true, status: existing.rows[0].status });
    }
    const status = isPrivate ? 'requested' : 'accepted';
    await pool.query('INSERT INTO follows (follower_id, following_id, status) VALUES ($1,$2,$3)', [req.user.id, targetId, status]);
    // Notify receiver
    try {
      const isReq = status==='requested';
      const msg = isReq ? `${req.user.username} sent you a follow request` : `${req.user.username} started following you`;
      const type = isReq ? 'follow_request' : 'follow_started';
      const nStatus = isReq ? 'pending' : 'info';
      await pool.query('INSERT INTO notifications (sender_id, receiver_id, message, type, status) VALUES ($1,$2,$3,$4,$5)', [req.user.id, targetId, msg, type, nStatus]);
    } catch(e){ console.warn('Notify on follow warn:', e.message); }
    res.json({ success:true, status });
  } catch(err){
    console.error('Follow error', err);
    res.status(500).json({ success:false, message:'Failed to follow' });
  }
});

// Accept follow request
app.post('/api/follow/:id/accept', authRequired, async (req,res)=>{
  try {
    const followerId = Number(req.params.id);
    const upd = await pool.query(`UPDATE follows SET status='accepted' WHERE follower_id=$1 AND following_id=$2 AND status='requested'`, [followerId, req.user.id]);
    if(upd.rowCount===0) return res.status(404).json({ success:false, message:'No pending request' });
    // Notify sender (the follower)
    try {
      const me = req.user;
      // Update original pending follow_request notification to accepted
      await pool.query("UPDATE notifications SET status='accepted' WHERE receiver_id=$1 AND sender_id=$2 AND COALESCE(type,'')='follow_request' AND status='pending'", [me.id, followerId]);
      await pool.query('INSERT INTO notifications (sender_id, receiver_id, message, type, status) VALUES ($1,$2,$3,$4,$5)', [me.id, followerId, 'Your follow request was accepted', 'follow_request_accepted', 'info']);
    } catch(e){ console.warn('Notify on accept warn:', e.message); }
    res.json({ success:true, status:'accepted' });
  } catch(err){
    console.error('Accept follow error', err);
    res.status(500).json({ success:false, message:'Failed to accept request' });
  }
});

// Alias: Accept follow request (alternative route)
app.post('/api/follow/accept/:id', authRequired, async (req,res)=>{
  try {
    const followerId = Number(req.params.id);
    const upd = await pool.query(`UPDATE follows SET status='accepted' WHERE follower_id=$1 AND following_id=$2 AND status='requested'`, [followerId, req.user.id]);
    if(upd.rowCount===0) return res.status(404).json({ success:false, message:'No pending request' });
    try {
      await pool.query("UPDATE notifications SET status='accepted' WHERE receiver_id=$1 AND sender_id=$2 AND COALESCE(type,'')='follow_request' AND status='pending'", [req.user.id, followerId]);
      await pool.query('INSERT INTO notifications (sender_id, receiver_id, message, type, status) VALUES ($1,$2,$3,$4,$5)', [req.user.id, followerId, 'Your follow request was accepted', 'follow_request_accepted', 'info']);
    } catch(e){ console.warn('Notify on accept (alias) warn:', e.message); }
    res.json({ success:true, status:'accepted' });
  } catch(err){
    console.error('Accept follow (alias) error', err);
    res.status(500).json({ success:false, message:'Failed to accept request' });
  }
});

// Decline follow request
app.post('/api/follow/:id/decline', authRequired, async (req,res)=>{
  try {
    const followerId = Number(req.params.id);
    const del = await pool.query(`DELETE FROM follows WHERE follower_id=$1 AND following_id=$2 AND status='requested'`, [followerId, req.user.id]);
    if(del.rowCount===0) return res.status(404).json({ success:false, message:'No pending request' });
    // Notify sender (the follower)
    try {
      await pool.query("UPDATE notifications SET status='declined' WHERE receiver_id=$1 AND sender_id=$2 AND COALESCE(type,'')='follow_request' AND status='pending'", [req.user.id, followerId]);
      await pool.query('INSERT INTO notifications (sender_id, receiver_id, message, type, status) VALUES ($1,$2,$3,$4,$5)', [req.user.id, followerId, 'Your follow request was declined', 'follow_request_declined', 'info']);
    } catch(e){ console.warn('Notify on decline warn:', e.message); }
    res.json({ success:true, status:'declined' });
  } catch(err){
    console.error('Decline follow error', err);
    res.status(500).json({ success:false, message:'Failed to decline request' });
  }
});

// Follow status between current user and target
app.get('/api/follow/status/:id', authRequired, async (req,res)=>{
  try {
    const targetId = Number(req.params.id);
    const r = await pool.query('SELECT status FROM follows WHERE follower_id=$1 AND following_id=$2',[req.user.id, targetId]);
    let st = r.rows[0]?.status || 'none';
    if(st === 'accepted') st = 'following';
    res.json({ success:true, status: st });
  } catch(err){
    console.error('Follow status error', err);
    res.status(500).json({ success:false, message:'Failed to get status' });
  }
});

// Relationship alias endpoint (same as follow status)
app.get('/api/relationship/:id', authRequired, async (req,res)=>{
  try {
    const targetId = Number(req.params.id);
    const r = await pool.query('SELECT status FROM follows WHERE follower_id=$1 AND following_id=$2',[req.user.id, targetId]);
    let st = r.rows[0]?.status || 'not_following';
    if(st === 'accepted') st = 'following';
    if(st === 'requested') st = 'requested';
    if(st === 'none') st = 'not_following';
    res.json({ success:true, status: st });
  } catch(err){
    console.error('Relationship status error', err);
    res.status(500).json({ success:false, message:'Failed to get relationship' });
  }
});

// Search users (by username/full_name), include follow status if auth
app.get('/api/users/search', async (req,res)=>{
  try {
    let q = String(req.query.q||'').trim().toLowerCase();
    // Allow queries like "@username" by stripping leading @ characters
    q = q.replace(/^@+/, '');
    if(!q) return res.json({ success:true, users: [] });
    const viewer = decodeAuth(req);
    if(viewer?.id){
      const rows = await pool.query(`
        SELECT u.id, u.username, u.full_name, u.is_private,
               COALESCE(f.status, 'none') AS follow_status
        FROM users u
        LEFT JOIN follows f ON f.follower_id = $1 AND f.following_id = u.id
        WHERE LOWER(u.username) LIKE $2 OR LOWER(u.full_name) LIKE $2
        ORDER BY u.username ASC
        LIMIT 20`, [viewer.id, '%'+q+'%']);
      return res.json({ success:true, users: rows.rows });
    } else {
      const rows = await pool.query(`
        SELECT u.id, u.username, u.full_name, u.is_private
        FROM users u
        WHERE LOWER(u.username) LIKE $1 OR LOWER(u.full_name) LIKE $1
        ORDER BY u.username ASC
        LIMIT 20`, ['%'+q+'%']);
      return res.json({ success:true, users: rows.rows });
    }
  } catch(err){
    console.error('User search error', err);
    res.status(500).json({ success:false, message:'Failed to search users' });
  }
});

// Resolve user by username
app.get('/api/users/by-username/:username', async (req,res)=>{
  try {
    const uname = String(req.params.username||'');
    const row = await pool.query('SELECT id, username, full_name, is_private FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1',[uname]);
    if(!row.rows.length) return res.status(404).json({ success:false, message:'User not found' });
    res.json({ success:true, user: row.rows[0] });
  } catch(err){
    console.error('By-username error', err);
    res.status(500).json({ success:false, message:'Failed to resolve user' });
  }
});

// Unfollow endpoint
app.delete('/api/follow/:id', authRequired, async (req,res)=>{
  try {
    const otherId = Number(req.params.id);
    // Try: current user unfollows other
    const del1 = await pool.query('DELETE FROM follows WHERE follower_id=$1 AND following_id=$2', [req.user.id, otherId]);
    if(del1.rowCount>0){
      return res.json({ success:true, status:'none', action:'unfollowed' });
    }
    // Try: decline incoming request (where other had requested to follow me)
    const del2 = await pool.query(`DELETE FROM follows WHERE follower_id=$1 AND following_id=$2 AND status='requested'`, [otherId, req.user.id]);
    if(del2.rowCount>0){
      try { await pool.query('INSERT INTO notifications (sender_id, receiver_id, message) VALUES ($1,$2,$3)', [req.user.id, otherId, 'Your follow request was declined']); } catch(e){ console.warn('Notify on decline (DELETE) warn:', e.message); }
      return res.json({ success:true, status:'none', action:'declined' });
    }
    return res.json({ success:true, status:'none' });
  } catch(err){
    console.error('Unfollow/Decline error', err);
    res.status(500).json({ success:false, message:'Failed to update follow' });
  }
});

// List unread notifications for current user
app.get('/api/notifications', authRequired, async (req,res)=>{
  try {
    const all = String(req.query.all||'').toLowerCase();
    const fetchAll = all==='1' || all==='true' || all==='yes';
    const rows = fetchAll
      ? await pool.query('SELECT id, sender_id, receiver_id, message, is_read, created_at, type, status FROM notifications WHERE receiver_id=$1 ORDER BY created_at DESC LIMIT 100', [req.user.id])
      : await pool.query('SELECT id, sender_id, receiver_id, message, is_read, created_at, type, status FROM notifications WHERE receiver_id=$1 AND is_read=FALSE ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json({ success:true, notifications: rows.rows });
  } catch(err){
    console.error('List notifications error', err);
    res.status(500).json({ success:false, message:'Failed to list notifications' });
  }
});

// Mark notification as read
app.post('/api/notifications/:id/read', authRequired, async (req,res)=>{
  try {
    const id = Number(req.params.id);
    await pool.query('UPDATE notifications SET is_read=TRUE WHERE id=$1 AND receiver_id=$2', [id, req.user.id]);
    res.json({ success:true });
  } catch(err){
    console.error('Mark notification read error', err);
    res.status(500).json({ success:false, message:'Failed to update notification' });
  }
});

// Accept follow request by notification ID
app.post('/api/notifications/:id/accept', authRequired, async (req,res)=>{
  try {
    const nId = Number(req.params.id);
    // Find the pending follow_request notification addressed to me
    const n = await pool.query("SELECT id, sender_id FROM notifications WHERE id=$1 AND receiver_id=$2 AND COALESCE(type,'')='follow_request' AND status='pending'", [nId, req.user.id]);
    if(!n.rows.length) return res.status(404).json({ success:false, message:'Follow request not found' });
    const followerId = n.rows[0].sender_id;
    const upd = await pool.query(`UPDATE follows SET status='accepted' WHERE follower_id=$1 AND following_id=$2 AND status='requested'`, [followerId, req.user.id]);
    if(upd.rowCount===0) return res.status(404).json({ success:false, message:'No pending request' });
    await pool.query("UPDATE notifications SET status='accepted' WHERE id=$1", [nId]);
    try {
      await pool.query('INSERT INTO notifications (sender_id, receiver_id, message, type, status) VALUES ($1,$2,$3,$4,$5)', [req.user.id, followerId, 'Your follow request was accepted', 'follow_request_accepted', 'info']);
    } catch(e){ console.warn('Notify accept by notif warn:', e.message); }
    res.json({ success:true, status:'accepted' });
  } catch(err){
    console.error('Accept by notification error', err);
    res.status(500).json({ success:false, message:'Failed to accept request' });
  }
});

// Decline follow request by notification ID
app.post('/api/notifications/:id/decline', authRequired, async (req,res)=>{
  try {
    const nId = Number(req.params.id);
    const n = await pool.query("SELECT id, sender_id FROM notifications WHERE id=$1 AND receiver_id=$2 AND COALESCE(type,'')='follow_request' AND status='pending'", [nId, req.user.id]);
    if(!n.rows.length) return res.status(404).json({ success:false, message:'Follow request not found' });
    const followerId = n.rows[0].sender_id;
    const del = await pool.query(`DELETE FROM follows WHERE follower_id=$1 AND following_id=$2 AND status='requested'`, [followerId, req.user.id]);
    if(del.rowCount===0) return res.status(404).json({ success:false, message:'No pending request' });
    await pool.query("UPDATE notifications SET status='declined' WHERE id=$1", [nId]);
    try {
      await pool.query('INSERT INTO notifications (sender_id, receiver_id, message, type, status) VALUES ($1,$2,$3,$4,$5)', [req.user.id, followerId, 'Your follow request was declined', 'follow_request_declined', 'info']);
    } catch(e){ console.warn('Notify decline by notif warn:', e.message); }
    res.json({ success:true, status:'declined' });
  } catch(err){
    console.error('Decline by notification error', err);
    res.status(500).json({ success:false, message:'Failed to decline request' });
  }
});

// List my follow requests (incoming)
app.get('/api/follow/requests', authRequired, async (req,res)=>{
  try {
    const rows = await pool.query(`
      SELECT f.follower_id as id, u.username, u.full_name
      FROM follows f JOIN users u ON f.follower_id = u.id
      WHERE f.following_id=$1 AND f.status='requested'
      ORDER BY f.created_at DESC`, [req.user.id]);
    res.json({ success:true, requests: rows.rows });
  } catch(err){
    console.error('List requests error', err);
    res.status(500).json({ success:false, message:'Failed to list requests' });
  }
});

// Mount auth routes (signup, login, profile, me)
require('./routes/auth')(app, pool);
// (Removed duplicate pool declaration)
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Global error handler to always return JSON errors (prevents empty/non-JSON responses)
app.use((err, req, res, next) => {
  try {
    console.error('Unhandled server error:', err && (err.stack || err));
  } catch (e) { /* ignore logging errors */ }
  if (res.headersSent) return next(err);
  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : 'Internal server error';
  res.status(status).json({ success: false, message });
});

// Code execution proxy endpoint
// POST /api/execute
// Body: { language, script, stdin, versionIndex }
// Requires auth for non-public usage; rate-limiting and further security recommended.
const axios = require('axios');
app.post('/api/execute', authRequired, async (req, res) => {
  try {
    const { language, script, stdin = '', versionIndex = '0' } = req.body || {};
    if (!language || !script) return res.status(400).json({ success: false, message: 'language and script are required' });

    // Use environment variables for provider selection and credentials
    // Default: JDoodle (set JD_CLIENT_ID and JD_CLIENT_SECRET in .env)
    const provider = process.env.CODE_EXEC_PROVIDER || 'jdoodle';

    if (provider === 'jdoodle') {
      const clientId = process.env.JD_CLIENT_ID;
      const clientSecret = process.env.JD_CLIENT_SECRET;
      if (!clientId || !clientSecret) return res.status(500).json({ success: false, message: 'Code execution provider not configured' });

      const payload = {
        clientId,
        clientSecret,
        script,
        language,
        versionIndex,
        stdin
      };

      const resp = await axios.post('https://api.jdoodle.com/v1/execute', payload, { timeout: 30000 });
      return res.json({ success: true, provider: 'jdoodle', data: resp.data });
    }

    return res.status(400).json({ success: false, message: 'Unsupported provider' });
  } catch (err) {
    console.error('Execute proxy error', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    const data = err?.response?.data || { message: err.message };
    return res.status(status).json({ success: false, message: 'Execution failed', error: data });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  if(!process.env.JWT_SECRET){
    console.warn('⚠️  JWT_SECRET not set. Using a fallback secret (NOT for production).');
  }
});