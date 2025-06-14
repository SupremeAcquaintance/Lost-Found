const express = require('express');
const { sql, poolPromise } = require('./config/config');
const router = express.Router();

router.use(express.json());

// POST /api/chat/start - Start a conversation between two users
router.post('/start', async (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2) {
    return res.status(400).json({ message: 'Both users are required to start a conversation.' });
  }

  try {
    const pool = await poolPromise;

    // Check if recipient exists
    const recipientCheck = await pool.request()
      .input('user2', sql.NVarChar, user2)
      .query('SELECT * FROM Users WHERE Email = @user2');

    if (recipientCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Recipient email not found.' });
    }

    // Check if conversation exists
    const checkConvo = await pool.request()
      .input('user1', sql.NVarChar, user1)
      .input('user2', sql.NVarChar, user2)
      .query(`
        SELECT * FROM Conversations
        WHERE (User1Email = @user1 AND User2Email = @user2)
          OR (User1Email = @user2 AND User2Email = @user1)
      `);

    if (checkConvo.recordset.length === 0) {
      const insertConvo = await pool.request()
        .input('user1', sql.NVarChar, user1)
        .input('user2', sql.NVarChar, user2)
        .query(`
          INSERT INTO Conversations (User1Email, User2Email)
          OUTPUT inserted.ConversationID
          VALUES (@user1, @user2)
        `);

      const conversationId = insertConvo.recordset[0].ConversationID;
      return res.status(201).json({ ConversationID: conversationId });
    } else {
      const conversationId = checkConvo.recordset[0].ConversationID;
      return res.status(200).json({ ConversationID: conversationId });
    }
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).send('Server Error');
  }
});

// POST /api/chat/message - Send a message
router.post('/message', async (req, res) => {
  const { conversationId, senderEmail, messageText } = req.body;

  if (!conversationId || !senderEmail || !messageText) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('conversationId', sql.Int, conversationId)
      .input('senderEmail', sql.NVarChar, senderEmail)
      .input('messageText', sql.NVarChar, messageText)
      .query(`
        INSERT INTO Messages (ConversationID, SenderEmail, MessageText)
        VALUES (@conversationId, @senderEmail, @messageText)
      `);

    res.status(201).send('Message sent');
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Server Error');
  }
});

// GET /api/chat/user-conversations/:userEmail - Fetch recent conversations for this user
router.get('/user-conversations/:userEmail', async (req, res) => {
  const { userEmail } = req.params;

  if (!userEmail) {
    return res.status(400).json({ message: 'User email is required.' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('userEmail', sql.NVarChar, userEmail)
      .query(`
        SELECT 
          c.ConversationID,
          CASE 
            WHEN c.User1Email = @userEmail THEN c.User2Email
            ELSE c.User1Email
          END AS ParticipantEmail
        FROM Conversations c
        WHERE c.User1Email = @userEmail OR c.User2Email = @userEmail
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).send('Server Error');
  }
});

// GET /api/chat/messages/:conversationId - Fetch messages
router.get('/messages/:conversationId', async (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ message: 'Conversation ID is required.' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('conversationId', sql.Int, conversationId)
      .query(`
        SELECT *
        FROM Messages
        WHERE ConversationID = @conversationId
        ORDER BY SentAt ASC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
