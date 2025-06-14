const express = require('express');
const { sql, poolPromise } = require('./config/config'); // Adjust path as needed
const router = express.Router();

// 1. GET /api/claims?status=<Pending|Approved|Rejected>
router.get('/', async (req, res) => {
  const status = req.query.status || 'Pending';

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('Status', sql.NVarChar, status)
      .query(`
        SELECT 
          c.ClaimID,
          c.ItemID,
          i.ItemName,
          i.Picture      AS ItemPicture,
          c.ClaimerUserID,
          u.Email        AS ClaimerEmail,
          c.Status       AS ClaimStatus,
          c.Message,
          c.Evidence     AS ClaimEvidence,
          c.CreatedAt
        FROM Claims c
        JOIN Items  i  ON c.ItemID         = i.ItemID
        JOIN Users  u  ON c.ClaimerUserID  = u.UserID
        WHERE c.Status = @Status
        ORDER BY c.CreatedAt DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching claims:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. PUT /api/claims/:claimId — approve or reject
router.put('/:claimId', async (req, res) => {
  const { claimId } = req.params;
  const { action, ModeratorEmail } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action.' });
  }

  if (!ModeratorEmail) {
    return res.status(400).json({ message: 'Moderator email is required.' });
  }

  try {
    const pool = await poolPromise;

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const actionType = action === 'approve' ? 'ApproveClaim' : 'RejectClaim';
    const description = `Moderator ${ModeratorEmail} ${action}d claim ID ${claimId}.`;

    // 1. Update the claim status
    await pool.request()
      .input('Status', sql.NVarChar, newStatus)
      .input('ClaimID', sql.Int, claimId)
      .query(`
        UPDATE Claims
        SET Status = @Status,
            UpdatedAt = GETDATE()
        WHERE ClaimID = @ClaimID
      `);

    // 2. Log the moderator action
    await pool.request()
      .input('UserEmail', sql.NVarChar, ModeratorEmail)
      .input('ActionType', sql.NVarChar, actionType)
      .input('ActionDescription', sql.NVarChar, description)
      .input('ClaimID', sql.Int, claimId)
      .query(`
        INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
        SELECT 
          @UserEmail,
          @ActionType,
          @ActionDescription,
          ItemID,
          'admin'
        FROM Claims WHERE ClaimID = @ClaimID
      `);

    res.json({ message: `Claim ${action}d.` });
  } catch (err) {
    console.error('Error updating claim:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;