const express = require('express');
const { sql, poolPromise } = require('./config/config');
const router = express.Router();

// POST new review
router.post('/', async (req, res) => {
  const { email, rating, comment } = req.body;
  if (!email || !rating) return res.status(400).json({ message: 'Missing required fields.' });

  try {
    const pool = await poolPromise;

    const userResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT UserID FROM Users WHERE Email = @email');

    if (!userResult.recordset.length)
      return res.status(404).json({ message: 'User not found.' });

    const userID = userResult.recordset[0].UserID;

    await pool.request()
      .input('userID', sql.Int, userID)
      .input('rating', sql.Int, rating)
      .input('comment', sql.NVarChar, comment || '')
      .query(`
        INSERT INTO SystemReviews (UserID, Rating, Comment)
        VALUES (@userID, @rating, @comment)
      `);

    res.status(201).json({ message: 'Review submitted successfully.' });
  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET all reviews
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT sr.ReviewID, sr.Rating, sr.Comment, sr.CreatedAt, u.Username
      FROM SystemReviews sr
      JOIN Users u ON sr.UserID = u.UserID
      ORDER BY sr.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Fetch review error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
