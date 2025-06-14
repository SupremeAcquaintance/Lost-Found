const express = require('express');
const { sql, poolPromise } = require('./config/config');
const router = express.Router();

router.get('/', async (req, res) => {
  const { actionType, email, role } = req.query;

  let query = `
    SELECT 
      LogID,
      UserEmail AS Email,
      ActionType,
      ActionDescription AS ActionDetails,
      Timestamp,
      AffectedItemID,
      ActorRole
    FROM ActivityLogs WHERE 1=1
  `;

  if (actionType) query += ` AND ActionType = @actionType`;
  if (email) query += ` AND UserEmail = @email`;
  if (role) query += ` AND ActorRole = @role`;

  query += ` ORDER BY Timestamp DESC`;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    if (actionType) request.input('actionType', sql.NVarChar, actionType);
    if (email) request.input('email', sql.NVarChar, email);
    if (role) request.input('role', sql.NVarChar, role);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;