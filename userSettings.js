const express = require('express');
const path = require('path');
const router = express.Router();
const { sql, poolPromise } = require('./config/config');
const bcrypt = require('bcrypt');

// Helper to safely load package.json from project root
const getPackageJson = () => {
  try {
    return require(path.join(process.cwd(), 'package.json'));
  } catch (err) {
    console.error('Failed to load package.json:', err);
    return { version: 'unknown' };
  }
};

// GET current user preferences
router.get('/', async (req, res) => {
  const userId = req.user?.UserID;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT Notifications, Theme FROM Users WHERE UserID = @userId');

    res.json({ preferences: result.recordset[0] || {} });
  } catch (err) {
    console.error('Error fetching user preferences:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT update user preferences
router.put('/preferences', async (req, res) => {
  const userId = req.user?.UserID;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const { notifications, theme } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('notifications', sql.Bit, notifications)
      .input('theme', sql.NVarChar, theme)
      .query(`
        UPDATE Users 
        SET Notifications = @notifications, Theme = @theme, UpdatedAt = GETDATE() 
        WHERE UserID = @userId
      `);
    res.json({ message: 'Preferences updated.' });
  } catch (err) {
    console.error('Error updating preferences:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST change password
router.post('/change-password', async (req, res) => {
  const userId = req.user?.UserID;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return res.status(400).json({ message: 'Missing fields.' });

  try {
    const pool = await poolPromise;
    const userRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT PasswordHash FROM Users WHERE UserID = @userId');

    if (userRes.recordset.length === 0)
      return res.status(404).json({ message: 'User not found.' });

    const hash = userRes.recordset[0].PasswordHash;
    const match = await bcrypt.compare(oldPassword, hash);
    if (!match) return res.status(401).json({ message: 'Incorrect password.' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('newHash', sql.NVarChar, newHash)
      .query('UPDATE Users SET PasswordHash = @newHash, UpdatedAt = GETDATE() WHERE UserID = @userId');

    res.json({ message: 'Password changed.' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE account (soft delete)
router.delete('/delete-account', async (req, res) => {
  const userId = req.user?.UserID;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE Users SET IsActive = 0, UpdatedAt = GETDATE() WHERE UserID = @userId');

    res.json({ message: 'Account deactivated.' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET system version
router.get('/system/version', (req, res) => {
  const { version } = getPackageJson();
  res.json({ version });
});

// GET about info
router.get('/system/about', (req, res) => {
  const { version } = getPackageJson();
  res.json({
    description: `Campus Lost & Found v${version} — an intelligent, AI-driven platform to reunite lost items with their owners.`
  });
});

module.exports = router;
