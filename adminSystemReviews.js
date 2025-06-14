const express = require('express');
const { sql, poolPromise } = require('./config/config');
const router = express.Router();

// GET all system reviews for admin
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT sr.ReviewID, sr.Rating, sr.Comment, sr.CreatedAt, u.Username, u.Email
      FROM SystemReviews sr
      JOIN Users u ON sr.UserID = u.UserID
      ORDER BY sr.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Admin fetch review error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE a review
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request().input('id', sql.Int, id).query(`
      DELETE FROM SystemReviews WHERE ReviewID = @id
    `);
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
