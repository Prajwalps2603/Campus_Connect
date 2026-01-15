const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = function(app, pool){
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_change_me';
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
  const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7);

  // Helper to sign token
  function signToken(user){
    // include role for RBAC checks
    return jwt.sign({ id: user.id, username: user.username, role: user.role || 'student' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Create a refresh token and persist to DB
  async function createRefreshToken(userId){
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    await pool.query('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)', [token, userId, expiresAt]);
    return token;
  }

  // Auth middleware
  async function authRequired(req, res, next){
    const auth = req.headers.authorization;
    if(!auth?.startsWith('Bearer ')){
      return res.status(401).json({ success:false, message:'Missing or invalid authorization header' });
    }
    const token = auth.slice(7);
    const decoded = (()=>{ try { return jwt.verify(token, JWT_SECRET); } catch { return null; } })();
    if(!decoded){
      return res.status(401).json({ success:false, message:'Invalid or expired token' });
    }
    req.user = decoded;
    return next();
  }

  // Signup
  app.post('/api/signup', async (req, res) => {
    try {
  let { fullName, email, phone, username, password, visibility } = req.body;
  // Normalize for uniqueness checks (store email lower; optionally store username as provided but check lower)
  const rawUsername = username;
  if(email) email = email.trim();
  if(username) username = username.trim();
  const normalizedEmail = email?.toLowerCase();
  const normalizedUsername = username?.toLowerCase();
      if(!(fullName && email && username && password)){
        return res.status(422).json({ success:false, message:'All required fields must be provided.' });
      }
      // Basic email pattern
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if(!emailRegex.test(email)) {
        return res.status(422).json({ success:false, message:'Invalid email format.' });
      }
      if(username.length < 3){
        return res.status(422).json({ success:false, message:'Username must be at least 3 characters.' });
      }
      if(password.length < 6){
        return res.status(422).json({ success:false, message:'Password must be at least 6 characters.' });
      }
      const userExists = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $2',[normalizedEmail, normalizedUsername]);
      if(userExists.rows.length){
        return res.status(409).json({ success:false, message:'User with this email or username already exists' });
      }
      const hashed = await bcrypt.hash(password, 10);
      const isPrivate = String(visibility||'public').toLowerCase() === 'private';
      const inserted = await pool.query(
        'INSERT INTO users (full_name, email, phone, username, password, is_private) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, full_name, email, phone, username, is_private, created_at',
        [fullName, normalizedEmail, phone, rawUsername, hashed, isPrivate]
      );
      const user = inserted.rows[0];
      const token = signToken(user);
      const refreshToken = await createRefreshToken(user.id);
      // Return refresh token in HttpOnly cookie and in body for convenience (frontend should store only via cookie)
      res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000 });
      res.json({ success:true, message:'User created successfully', token, refreshToken, user });
    } catch(err){
      console.error('Signup error:', err);
      res.status(500).json({ success:false, message:'Server error during signup' });
    }
  });

  // Login
  app.post('/api/login', async (req, res) => {
    try {
      const { loginId, password } = req.body;
      if(!(loginId && password)){
        return res.status(422).json({ success:false, message:'Both login identifier and password are required.' });
      }
      const found = await pool.query('SELECT * FROM users WHERE email=$1 OR username=$1 OR phone=$1',[loginId]);
      if(!found.rows.length){
        return res.status(401).json({ success:false, message:'Invalid credentials' });
      }
      const userRow = found.rows[0];
      const valid = await bcrypt.compare(password, userRow.password);
      if(!valid){
        return res.status(401).json({ success:false, message:'Invalid credentials' });
      }
      const { password: removed, ...user } = userRow; // eslint-disable-line no-unused-vars
      const token = signToken(user);
      const refreshToken = await createRefreshToken(user.id);
      res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000 });
      res.json({ success:true, message:'Login successful', token, refreshToken, user });
    } catch(err){
      console.error('Login error:', err);
      try { console.warn('login_events insert warn:', err?.message || err); } catch {}
      res.status(500).json({ success:false, message:'Server error during login' });
    }
  });

  // Get current user (token based)
  app.get('/api/me', authRequired, async (req, res) => {
    try {
      const result = await pool.query('SELECT id, full_name, email, phone, username, created_at FROM users WHERE id=$1',[req.user.id]);
      if(!result.rows.length){
        return res.status(404).json({ success:false, message:'User not found' });
      }
      res.json({ success:true, user: result.rows[0] });
    } catch(err){
      console.error('Me endpoint error:', err);
      res.status(500).json({ success:false, message:'Server error' });
    }
  });

  // Public user profile
  app.get('/api/user/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await pool.query('SELECT id, full_name, email, phone, username, is_private, created_at FROM users WHERE id=$1',[id]);
      if(!user.rows.length){
        return res.status(404).json({ success:false, message:'User not found' });
      }
      res.json({ success:true, user: user.rows[0] });
    } catch(err){
      console.error('Get user error:', err);
      res.status(500).json({ success:false, message:'Server error' });
    }
  });

  // Token verification endpoint (useful for frontend silent auth)
  app.get('/api/verify-token', authRequired, (req, res) => {
    res.json({ success:true, user:req.user });
  });

  // Refresh token endpoint
  app.post('/api/token/refresh', async (req, res) => {
    try {
      // Allow token via cookie or body
      const incoming = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
      if(!incoming) return res.status(400).json({ success:false, message:'Refresh token required' });
      const row = await pool.query('SELECT token, user_id, expires_at, revoked FROM refresh_tokens WHERE token=$1', [incoming]);
      if(!row.rows.length) return res.status(404).json({ success:false, message:'Refresh token not found' });
      const rec = row.rows[0];
      if(rec.revoked) return res.status(401).json({ success:false, message:'Refresh token revoked' });
      if(new Date(rec.expires_at) < new Date()) return res.status(401).json({ success:false, message:'Refresh token expired' });
      const userRow = await pool.query('SELECT id, username, role FROM users WHERE id=$1',[rec.user_id]);
      if(!userRow.rows.length) return res.status(404).json({ success:false, message:'User not found' });
      const user = userRow.rows[0];
      const newToken = signToken(user);
      // Optionally rotate refresh token
      const newRefresh = await createRefreshToken(user.id);
      await pool.query('UPDATE refresh_tokens SET revoked=TRUE WHERE token=$1', [incoming]);
      res.cookie('refreshToken', newRefresh, { httpOnly: true, sameSite: 'lax', maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000 });
      res.json({ success:true, token: newToken, refreshToken: newRefresh });
    } catch(err){
      console.error('Refresh token error', err);
      res.status(500).json({ success:false, message:'Failed to refresh token' });
    }
  });

  // Revoke refresh token
  app.post('/api/token/revoke', authRequired, async (req, res) => {
    try {
      const toRevoke = req.body?.refreshToken || req.cookies?.refreshToken || req.headers['x-refresh-token'];
      if(!toRevoke) return res.status(400).json({ success:false, message:'Refresh token required' });
      // Only allow revoking tokens of the logged-in user
      const r = await pool.query('SELECT user_id FROM refresh_tokens WHERE token=$1',[toRevoke]);
      if(!r.rows.length) return res.status(404).json({ success:false, message:'Token not found' });
      if(Number(r.rows[0].user_id) !== Number(req.user.id)) return res.status(403).json({ success:false, message:'Not allowed' });
      await pool.query('UPDATE refresh_tokens SET revoked=TRUE WHERE token=$1',[toRevoke]);
      res.json({ success:true, message:'Refresh token revoked' });
    } catch(err){
      console.error('Revoke token error', err);
      res.status(500).json({ success:false, message:'Failed to revoke' });
    }
  });

  // Update profile (full_name, phone) - future: avatar, bio
  app.patch('/api/profile', authRequired, async (req, res) => {
    try {
      const { fullName, phone } = req.body;
      if(!(fullName || phone)){
        return res.status(422).json({ success:false, message:'Nothing to update.' });
      }
      const updates = [];
      const params = [];
      let idx = 1;
      if(fullName){
        updates.push(`full_name = $${idx++}`);
        params.push(fullName);
      }
      if(phone){
        updates.push(`phone = $${idx++}`);
        params.push(phone);
      }
      params.push(req.user.id);
      const q = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, full_name, email, phone, username, created_at`;
      const result = await pool.query(q, params);
      res.json({ success:true, message:'Profile updated', user: result.rows[0] });
    } catch(err){
      console.error('Profile update error:', err);
      res.status(500).json({ success:false, message:'Server error updating profile' });
    }
  });

  // Change password
  app.post('/api/change-password', authRequired, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if(!(currentPassword && newPassword)){
        return res.status(422).json({ success:false, message:'Current and new password required.' });
      }
      if(newPassword.length < 6){
        return res.status(422).json({ success:false, message:'New password must be at least 6 characters.' });
      }
      const userResult = await pool.query('SELECT id, password FROM users WHERE id=$1',[req.user.id]);
      if(!userResult.rows.length){
        return res.status(404).json({ success:false, message:'User not found' });
      }
      const userRow = userResult.rows[0];
      const valid = await bcrypt.compare(currentPassword, userRow.password);
      if(!valid){
        return res.status(401).json({ success:false, message:'Current password incorrect.' });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password=$1 WHERE id=$2',[hashed, req.user.id]);
      res.json({ success:true, message:'Password changed successfully' });
    } catch(err){
      console.error('Change password error:', err);
      res.status(500).json({ success:false, message:'Server error changing password' });
    }
  });
};
