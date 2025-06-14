const express = require('express');
const { sql, poolPromise } = require('./config/config');
const bcrypt = require('bcrypt');
const router = express.Router();

// GET /api/admin/users
// Optionally filter by ?userType=..., ?role=..., ?suspended=true/false
router.get('/', async (req, res) => {
  const { userType, role, suspended } = req.query;

  let query = `
    SELECT 
      UserID, RegNumber, Username, Email, Phone,
      UserType, Role, IsSuspended, IsVerified,
      FlagCount, LastFlagReason, CreatedAt, UpdatedAt, Residence
    FROM dbo.Users
    WHERE 1=1
  `;

  if (userType) query += ` AND UserType = @userType`;
  if (role) query += ` AND Role = @role`;
  if (suspended !== undefined) query += ` AND IsSuspended = @suspended`;

  query += ` ORDER BY CreatedAt DESC`;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    if (userType) request.input('userType', sql.NVarChar, userType);
    if (role) request.input('role', sql.NVarChar, role);
    if (suspended !== undefined) request.input('suspended', sql.Bit, suspended === 'true');

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/admin/users/search?query=...
// Search by RegNumber, Username, or Email
router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Search query is required.' });

  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('query', sql.NVarChar, `%${query}%`);

    const result = await request.query(`
      SELECT 
        UserID, RegNumber, Username, Email, Phone,
        UserType, Role, IsSuspended, IsVerified,
        FlagCount, LastFlagReason, CreatedAt, UpdatedAt, Residence
      FROM dbo.Users
      WHERE 
        RegNumber LIKE @query OR
        Username LIKE @query OR
        Email LIKE @query
      ORDER BY CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/admin/users/suspend
router.post('/suspend', async (req, res) => {
  const { userId, reason, adminEmail } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required.' });

  try {
    const pool = await poolPromise;

    // Suspend user
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE dbo.Users
        SET 
          IsSuspended = 1,
          FlagCount = FlagCount + 1,
          LastFlagReason = @reason
        WHERE UserID = @userId
      `);

    // Log admin suspension action
    const description = `Admin ${adminEmail} suspended user ID ${userId}. Reason: ${reason || 'No reason provided'}`;
    await pool.request()
      .input('adminEmail', sql.NVarChar, adminEmail)
      .input('description', sql.NVarChar, description)
      .input('userId', sql.Int, userId)
      .query(`
        INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
        VALUES (
          @adminEmail,
          'SuspendUser',
          @description,
          @userId,
          'admin'
        )
      `);

    res.json({ message: 'User suspended.' });
  } catch (err) {
    console.error('Error suspending user:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/admin/users/unsuspend
router.post('/unsuspend', async (req, res) => {
  const { userId, adminEmail } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required.' });

  try {
    const pool = await poolPromise;

    // Unsuspend user
    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE dbo.Users
        SET IsSuspended = 0
        WHERE UserID = @userId
      `);

    // Log admin unsuspend action
    const description = `Admin ${adminEmail} unsuspended user ID ${userId}.`;
    await pool.request()
      .input('adminEmail', sql.NVarChar, adminEmail)
      .input('description', sql.NVarChar, description)
      .input('userId', sql.Int, userId)
      .query(`
        INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
        VALUES (
          @adminEmail,
          'UnsuspendUser',
          @description,
          @userId,
          'admin'
        )
      `);

    res.json({ message: 'User unsuspended.' });
  } catch (err) {
    console.error('Error unsuspending user:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/admin/users/verify
router.post('/verify', async (req, res) => {
  const { userId, adminEmail } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required.' });

  try {
    const pool = await poolPromise;

    // Verify user
    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE dbo.Users
        SET IsVerified = 1
        WHERE UserID = @userId
      `);

    // Log admin verify action
    const description = `Admin ${adminEmail} verified user ID ${userId}.`;
    await pool.request()
      .input('adminEmail', sql.NVarChar, adminEmail)
      .input('description', sql.NVarChar, description)
      .input('userId', sql.Int, userId)
      .query(`
        INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
        VALUES (
          @adminEmail,
          'VerifyUser',
          @description,
          @userId,
          'admin'
        )
      `);

    res.json({ message: 'User verified.' });
  } catch (err) {
    console.error('Error verifying user:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/admin/users/flagged
router.get('/flagged', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        UserID, Username, Email, RegNumber, Phone,
        UserType, Role, FlagCount, LastFlagReason, IsSuspended, IsVerified,
        CreatedAt, Residence
      FROM dbo.Users
      WHERE FlagCount > 0
      ORDER BY FlagCount DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching flagged users:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/admin/users/create-admin
router.post('/create-admin', async (req, res) => {
  const { RegNumber, Username, Email, Phone, Residence, Password, adminEmail } = req.body;

  if (!Username || !Email || !Password) {
    return res.status(400).json({ message: 'Username, Email, and Password are required.' });
  }

  try {
    const pool = await poolPromise;

    // Check for duplicate email
    const dupCheck = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query('SELECT 1 FROM dbo.Users WHERE Email = @Email');
    
    if (dupCheck.recordset.length) {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(Password, 10);

    // Insert new admin user
    await pool.request()
      .input('RegNumber',    sql.NVarChar, RegNumber || null)
      .input('Username',     sql.NVarChar, Username)
      .input('Email',        sql.NVarChar, Email)
      .input('Phone',        sql.NVarChar, Phone || null)
      .input('UserType',     sql.NVarChar, 'Staff')
      .input('PasswordHash', sql.NVarChar, passwordHash)
      .input('Residence',    sql.NVarChar, Residence || null)
      .query(`
        INSERT INTO dbo.Users
          (RegNumber, Username, Email, Phone, UserType, PasswordHash, Residence)
        VALUES
          (@RegNumber, @Username, @Email, @Phone, @UserType, @PasswordHash, @Residence)
      `);

    // Log the admin action
    const description = `Admin ${adminEmail} created new admin user with email ${Email}.`;
    await pool.request()
      .input('UserEmail',       sql.NVarChar, adminEmail)
      .input('ActionType',      sql.NVarChar, 'CreateAdmin')
      .input('ActionDescription', sql.NVarChar, description)
      .input('AffectedItemID',  sql.Int, null)
      .input('ActorRole',       sql.NVarChar, 'admin')
      .query(`
        INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
        VALUES (@UserEmail, @ActionType, @ActionDescription, @AffectedItemID, @ActorRole)
      `);

    res.status(201).json({ message: 'Admin user created successfully.' });
  } catch (err) {
    console.error('Error creating admin user:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
