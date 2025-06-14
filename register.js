const express = require('express');
const { sql, poolPromise } = require('./config/config');
const bcrypt = require('bcrypt');

const app = express.Router();
app.use(express.json());

app.post('/', async (req, res) => {
  const { RegNumber, Username, Email, Phone, UserType, PasswordHash, Residence } = req.body;

  if (!RegNumber || !Username || !Email || !Phone || !UserType || !PasswordHash || !Residence) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const pool = await poolPromise;

    const existingUser = await pool
      .request()
      .input('Email', sql.NVarChar, Email)
      .input('Username', sql.NVarChar, Username)
      .input('RegNumber', sql.NVarChar, RegNumber)
      .query(`
        SELECT * FROM Users 
        WHERE Email = @Email OR Username = @Username OR RegNumber = @RegNumber
      `);

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email, username, or registration number already registered' });
    }

    const HashedPassword = await bcrypt.hash(PasswordHash, 10);

    const insertUserResult = await pool
    .request()
    .input('RegNumber', sql.NVarChar, RegNumber)
    .input('Username', sql.NVarChar, Username)
    .input('Email', sql.NVarChar, Email)
    .input('Phone', sql.NVarChar, Phone)
    .input('UserType', sql.NVarChar, UserType)
    .input('HashedPassword', sql.NVarChar, HashedPassword)
    .input('Residence', sql.NVarChar, Residence)
    .query(`
      DECLARE @InsertedUsers TABLE (UserID INT);

      INSERT INTO Users (RegNumber, Username, Email, Phone, UserType, PasswordHash, Residence)
      OUTPUT INSERTED.UserID INTO @InsertedUsers(UserID)
      VALUES (@RegNumber, @Username, @Email, @Phone, @UserType, @HashedPassword, @Residence);

      SELECT UserID FROM @InsertedUsers;
    `);


    if (insertUserResult.rowsAffected[0] > 0) {
      const userID = insertUserResult.recordset[0].UserID;

      const welcomeMessage = `
Hi ${Username}, Welcome to Campus Lost & Found.. Your Campus Just Got Smarter.
Thank you for joining our community! Whether it’s a lost water bottle or a found laptop, you’re now part of a smarter, more connected campus where every item has a better chance of getting home.
Stay alert, stay kind and keep an eye out—someone might be looking for what you’ve found, or holding on to what you’ve lost.
Let’s turn good intentions into real actions, one item at a time.
Start exploring now—your campus needs you.
      `.trim();

      await pool
        .request()
        .input('UserID', sql.Int, userID)
        .input('Message', sql.NVarChar(sql.MAX), welcomeMessage)
        .query(`
          INSERT INTO Notifications (UserID, Message, IsRead, CreatedAt)
          VALUES (@UserID, @Message, 0, GETDATE())
        `);

      await pool
        .request()
        .input('Email', sql.NVarChar, Email)
        .query(`
          INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, ActorRole)
          VALUES (@Email, 'Register', 'New user registered successfully', 'user')
        `);

      return res.status(201).json({ message: 'User registered and welcomed successfully', welcomeMessage });
    } else {
      return res.status(500).json({ message: 'Registration failed' });
    }
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Registration failed due to server error' });
  }
});

module.exports = app;
