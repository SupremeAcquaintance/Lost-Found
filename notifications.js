// File: src/backend/models/notifications.js
const express = require('express');
const { sql, poolPromise } = require('./config/config');
const router = express.Router();

// GET user notifications
router.get('/', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const pool = await poolPromise;

    const userResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT UserID FROM Users WHERE Email = @email');

    if (userResult.recordset.length === 0)
      return res.status(404).json({ message: 'User not found.' });

    const userID = userResult.recordset[0].UserID;

    const result = await pool
      .request()
      .input('userID', sql.Int, userID)
      .query(`
        SELECT NotificationID, Message, IsRead, CreatedAt 
        FROM Notifications 
        WHERE UserID = @userID 
        ORDER BY CreatedAt DESC
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: 'No notifications found.' });

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT mark notification as read
router.put('/read/:notificationID', async (req, res) => {
  const { notificationID } = req.params;
  if (!notificationID) return res.status(400).json({ message: 'Notification ID is required.' });

  try {
    const pool = await poolPromise;

    const updateResult = await pool
      .request()
      .input('notificationID', sql.Int, notificationID)
      .query(`
        UPDATE Notifications 
        SET IsRead = 1 
        WHERE NotificationID = @notificationID
      `);

    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
