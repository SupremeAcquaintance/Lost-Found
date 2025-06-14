const express = require('express');
const { sql, poolPromise } = require('./config/config');
const router = express.Router();

// Admin sends announcement to all users
router.post('/announce', async (req, res) => {
  const { message, userEmail } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    const pool = await poolPromise;

    // Get all user IDs
    const userResult = await pool.request().query('SELECT UserID FROM Users');
    const users = userResult.recordset;

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found in the system.' });
    }

    // Bulk insert notifications
    const table = new sql.Table('Notifications');
    table.create = false;
    table.columns.add('UserID', sql.Int, { nullable: false });
    table.columns.add('Message', sql.NVarChar(sql.MAX), { nullable: false });

    users.forEach(user => {
      table.rows.add(user.UserID, message);
    });

    await pool.request().bulk(table);

    // Log the admin announcement in ActivityLogs
    const description = `Admin ${userEmail} sent a system-wide announcement: "${message}"`;

    await pool.request()
      .input('userEmail', sql.NVarChar, userEmail)
      .input('description', sql.NVarChar(sql.MAX), description)
      .query(`
        INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
        VALUES (@userEmail, 'SendAnnouncement', @description, NULL, 'admin')
      `);

    res.status(200).json({ message: 'Announcement sent to all users successfully.' });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  // no sql.close() here because pool is managed globally
});

module.exports = router;
