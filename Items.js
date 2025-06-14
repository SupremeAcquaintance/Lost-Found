// items backend.
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const { sql, poolPromise } = require('./config/config'); // ✅ Use shared pool
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper: Call Python embedding service
async function getEmbedding(text) {
  try {
    const response = await axios.post('http://localhost:5001/embed', { texts: [text] });
    return response.data.embeddings[0];
  } catch (err) {
    console.error('Embedding generation failed:', err.message);
    return null;
  }
}

router.post('/', upload.single('image'), async (req, res) => {
  const { itemName, description, category, location, status, userEmail } = req.body;
  const picture = req.file?.buffer || null;

  if (picture && picture.length > 5 * 1024 * 1024) {
    return res.status(400).json({ message: 'Image size should be less than 5MB.' });
  }

  if (!itemName || !status || !userEmail) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  const combinedText = `A ${itemName} with ${description} was discovered at the ${location}`;
  const embedding = await getEmbedding(combinedText);
  if (!embedding) return res.status(500).json({ message: 'Embedding generation failed.' });

  try {
    const pool = await poolPromise;

    const userResult = await pool.request()
      .input('Email', sql.VarChar, userEmail)
      .query('SELECT UserID FROM Users WHERE Email = @Email');

    if (userResult.recordset.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const userID = userResult.recordset[0].UserID;

    const insertItemResult = await pool.request()
      .input('ItemName', sql.NVarChar, itemName)
      .input('Description', sql.NVarChar, description)
      .input('Category', sql.NVarChar, category)
      .input('Location', sql.NVarChar, location)
      .input('Status', sql.NVarChar, status)
      .input('UserID', sql.Int, userID)
      .input('Picture', sql.VarBinary(sql.MAX), picture)
      .input('Embedding', sql.VarChar(sql.MAX), JSON.stringify(embedding))
      .query(`
        INSERT INTO Items (ItemName, Description, Category, Location, Status, UserID, Picture, Embedding)
        OUTPUT INSERTED.ItemID
        VALUES (@ItemName, @Description, @Category, @Location, @Status, @UserID, @Picture, @Embedding)
      `);

    const insertedItemID = insertItemResult.recordset[0].ItemID;

    // ✅ Log the report action
    await pool.request()
      .input('UserEmail', sql.VarChar, userEmail)
      .input('ActionType', sql.VarChar, 'Report')
      .input('ActionDescription', sql.VarChar, `User reported a ${status} item: ${itemName} at ${location}`)
      .input('AffectedItemID', sql.Int, insertedItemID)
      .input('ActorRole', sql.VarChar, 'user')
      .query(`
        INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
        VALUES (@UserEmail, @ActionType, @ActionDescription, @AffectedItemID, @ActorRole)
      `);

    const matchStatus = status === 'Lost' ? 'Found' : 'Lost';

    const matchQuery = await pool.request()
      .input('MatchStatus', sql.VarChar, matchStatus)
      .input('CurrentUserID', sql.Int, userID)
      .query(`
        SELECT ItemID, UserID, Embedding 
        FROM Items 
        WHERE Status = @MatchStatus AND UserID != @CurrentUserID
      `);

    const similarities = matchQuery.recordset.map(item => {
      const existingEmbedding = JSON.parse(item.Embedding);
      const dotProduct = embedding.reduce((acc, val, i) => acc + val * existingEmbedding[i], 0);
      return { ...item, similarity: dotProduct };
    });

    const threshold = 0.8;
    const matchedItems = similarities.filter(m => m.similarity > threshold);

    // Notify and log match for each matched item
    for (const match of matchedItems) {
      const msg = `A potentially matching item was ${status === 'Lost' ? 'found' : 'reported lost'}: "${itemName}" at "${location}". Check now!`;

      await pool.request()
        .input('UserID', sql.Int, match.UserID)
        .input('Message', sql.VarChar(sql.MAX), msg)
        .query(`INSERT INTO Notifications (UserID, Message) VALUES (@UserID, @Message)`);

      await pool.request()
        .input('UserEmail', sql.VarChar, 'Automatic')
        .input('ActionType', sql.VarChar, 'AutoMatch')
        .input('ActionDescription', sql.VarChar, `System detected a ${threshold * 100}% match between item ${insertedItemID} and item ${match.ItemID}`)
        .input('AffectedItemID', sql.Int, match.ItemID)
        .input('ActorRole', sql.VarChar, 'System')
        .query(`
          INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
          VALUES (@UserEmail, @ActionType, @ActionDescription, @AffectedItemID, @ActorRole)
        `);
    }

    let matchedItemDetails = [];
    if (matchedItems.length > 0) {
      const idList = matchedItems.map(m => m.ItemID).join(',');
      const detailQuery = await pool.request().query(`
        SELECT i.ItemID, i.ItemName, i.Description, i.Category, i.Location, i.Status, u.Email
        FROM Items i
        JOIN Users u ON i.UserID = u.UserID
        WHERE i.ItemID IN (${idList})
      `);
      matchedItemDetails = detailQuery.recordset;
    }

    res.status(201).json({
      message: 'Item reported successfully.',
      insertedItemID,
      matchedCount: matchedItems.length,
      matchedItems: matchedItemDetails
    });

  } catch (error) {
    console.error('Error reporting item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper: Calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (magA * magB);
}

// GET /api/items/matches
router.get('/matches', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Step 1: Get all items with embeddings
    const itemsResult = await pool.request().query(`
      SELECT i.ItemID, i.ItemName, i.Description, i.Category, i.Location, i.Status, i.UserID, i.Picture, i.Embedding,
             u.Email
      FROM Items i
      JOIN Users u ON i.UserID = u.UserID
      WHERE i.Embedding IS NOT NULL
    `);
    const items = itemsResult.recordset;

    // Step 2: Separate Lost and Found items
    const lostItems = items.filter(item => item.Status === 'Lost');
    const foundItems = items.filter(item => item.Status === 'Found');

    // Step 3: Prepare embedding map and item info map
    const embeddings = {};
    const itemMap = {};
    items.forEach(item => {
      embeddings[item.ItemID] = JSON.parse(item.Embedding);
      itemMap[item.ItemID] = {
        ItemID: item.ItemID,
        ItemName: item.ItemName,
        Description: item.Description,
        Category: item.Category,
        Location: item.Location,
        Status: item.Status,
        Email: item.Email,
        Picture: item.Picture
      };
    });

    // Step 4: Match Lost -> Found items using cosine similarity
    const thresholdPercent = parseInt(req.query.threshold || '75'); // Default 75%
    const threshold = thresholdPercent / 100;
    const matchedGroups = [];

    for (const lost of lostItems) {
      const group = { item: itemMap[lost.ItemID], matches: [] };
      for (const found of foundItems) {
        const sim = cosineSimilarity(embeddings[lost.ItemID], embeddings[found.ItemID]);
        if (sim >= threshold) {
          group.matches.push(itemMap[found.ItemID]);
        }
      }
      if (group.matches.length > 0) matchedGroups.push(group);
    }

    // Step 5: Log each matched pair in ActivityLogs
    for (const group of matchedGroups) {
      const lostItem = group.item;
      for (const foundItem of group.matches) {
        await pool.request()
          .input('UserEmail', sql.VarChar, 'admin')
          .input('ActionType', sql.VarChar, 'AdminMatch')
          .input('ActionDescription', sql.VarChar, `Admin reviewed a ${thresholdPercent}% match: Lost item ID ${lostItem.ItemID} with Found item ID ${foundItem.ItemID}`)
          .input('AffectedItemID', sql.Int, foundItem.ItemID)
          .input('ActorRole', sql.VarChar, 'admin')
          .query(`
            INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
            VALUES (@UserEmail, @ActionType, @ActionDescription, @AffectedItemID, @ActorRole)
          `);
      }
    }

    res.json(matchedGroups);
  } catch (error) {
    console.error('Error in /api/items/matches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const deletedAt = new Date().toISOString();

    const result = await pool.request()
      .input('ItemID', sql.Int, id)
      .input('DeletedAt', sql.DateTime, deletedAt)
      .query(`
        UPDATE Items
        SET IsDeleted = 1, DeletedAt = @DeletedAt
        WHERE ItemID = @ItemID
      `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Item soft-deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Item not found.' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

router.get('/search', async (req, res) => {
  const { name, category, location } = req.query;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    // Build dynamic WHERE conditions based on provided search parameters
    let whereClauses = [];
    if (name) {
      request.input('Name', sql.NVarChar, `%${name}%`);
      whereClauses.push('LOWER(ItemName) LIKE LOWER(@Name)');
    }
    if (category) {
      request.input('Category', sql.NVarChar, `%${category}%`);
      whereClauses.push('LOWER(Category) LIKE LOWER(@Category)');
    }
    if (location) {
      request.input('Location', sql.NVarChar, `%${location}%`);
      whereClauses.push('LOWER(Location) LIKE LOWER(@Location)');
    }

    if (whereClauses.length === 0) {
      return res.status(400).json({ message: 'At least one search parameter must be provided.' });
    }

    const whereClause = whereClauses.join(' AND ');

    const query = `
      SELECT i.ItemID, i.ItemName, i.Description, i.Category, i.Location, i.Status, i.Picture, u.Email
      FROM Items i
      INNER JOIN Users u ON i.UserID = u.UserID
      WHERE ${whereClause}
      ORDER BY i.CreatedAt DESC
    `;

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/lost', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT i.ItemID, i.ItemName, i.Description, i.Category, i.Location, i.Status, i.Picture, u.Email
      FROM Items i
      INNER JOIN Users u ON i.UserID = u.UserID
      WHERE i.Status = 'Lost'
      ORDER BY i.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching lost items:', error);
    res.status(500).json({ message: 'Failed to fetch lost items' });
  }
});

router.get('/found', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT i.ItemID, i.ItemName, i.Description, i.Category, i.Location, i.Status, i.Picture, u.Email
      FROM Items i
      INNER JOIN Users u ON i.UserID = u.UserID
      WHERE i.Status = 'Found'
      ORDER BY i.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching found items:', error);
    res.status(500).json({ message: 'Failed to fetch found items' });
  }
});

// GET /api/items/:id - Get item by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('ItemID', sql.Int, id)
      .query(`
        SELECT Items.*, Users.Email
        FROM Items
        INNER JOIN Users ON Items.UserID = Users.UserID
        WHERE ItemID = @ItemID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching item by ID:', error);
    res.status(500).json({ message: 'Failed to fetch item details' });
  }
});

// GET /history/:email - Get history
router.get('/history/:email', async (req, res) => {
  const { email } = req.params;

  if (!email) return res.status(400).json({ message: 'Unauthorized 1.' });

  try {
    const pool = await poolPromise;

    const userResult = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query('SELECT UserID FROM Users WHERE Email = @Email');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Unauthorized' });
    }

    const userId = userResult.recordset[0].UserID;

    const itemsResult = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT * FROM Items WHERE UserID = @UserID ORDER BY CreatedAt DESC');

    res.json(itemsResult.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Item not found' });
  }
});

// Update item by id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { ItemName, Description, Category, Location, Status, userEmail } = req.body;

  if (!ItemName || !Status) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    const pool = await poolPromise;

    // Generate new embedding
    const combinedText = `A ${ItemName} with ${Description} was discovered at the ${Location}`;
    const embedding = await getEmbedding(combinedText);
    if (!embedding) return res.status(500).json({ message: 'Embedding generation failed.' });

    // Update item
    await pool.request()
      .input('ItemID', sql.Int, id)
      .input('ItemName', sql.NVarChar, ItemName)
      .input('Description', sql.NVarChar, Description)
      .input('Category', sql.NVarChar, Category)
      .input('Location', sql.NVarChar, Location)
      .input('Status', sql.NVarChar, Status)
      .input('Embedding', sql.VarChar(sql.MAX), JSON.stringify(embedding))
      .query(`
        UPDATE Items
        SET ItemName = @ItemName,
            Description = @Description,
            Category = @Category,
            Location = @Location,
            Status = @Status,
            Embedding = @Embedding
        WHERE ItemID = @ItemID
      `);

    // Log the update action
    const logDescription = `User ${userEmail} updated item ID ${id} with name "${ItemName}", location "${Location}", and status "${Status}".`;

    await pool.request()
      .input('UserEmail', sql.NVarChar, userEmail)
      .input('ActionDescription', sql.NVarChar, logDescription)
      .input('ItemID', sql.Int, id)
      .query(`
        INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
        VALUES (
          @UserEmail,
          'UpdateItem',
          @ActionDescription,
          @ItemID,
          'user'
        )
      `);

    res.json({ message: 'Item updated successfully.' });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ message: 'Failed to update item.' });
  }
});

router.post('/:id/claim', upload.single('evidence'), async (req, res) => {
  const { id: ItemID } = req.params;
  const { ClaimerEmail, Message } = req.body;
  const evidence = req.file?.buffer || null;

  if (!ClaimerEmail) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const pool = await poolPromise;

    // 1. Lookup user
    const userResult = await pool.request()
      .input('Email', sql.NVarChar, ClaimerEmail)
      .query(`SELECT UserID, Role FROM Users WHERE Email = @Email`);

    if (!userResult.recordset.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { UserID: ClaimerUserID, Role: ClaimerRole } = userResult.recordset[0];

    // 2. Prevent duplicate claim
    const dupResult = await pool.request()
      .input('ItemID', sql.Int, ItemID)
      .input('ClaimerUserID', sql.Int, ClaimerUserID)
      .query(`
        SELECT 1 FROM Claims WHERE ItemID = @ItemID AND ClaimerUserID = @ClaimerUserID
      `);

    if (dupResult.recordset.length) {
      return res.status(409).json({ message: 'Already claimed.' });
    }

    // 3. Insert claim with message and evidence
    await pool.request()
      .input('ItemID', sql.Int, ItemID)
      .input('ClaimerUserID', sql.Int, ClaimerUserID)
      .input('Message', sql.NVarChar, Message || '')
      .input('Evidence', sql.VarBinary(sql.MAX), evidence)
      .query(`
        INSERT INTO Claims (ItemID, ClaimerUserID, Status, Message, Evidence)
        VALUES (@ItemID, @ClaimerUserID, 'Pending', @Message, @Evidence)
      `);

    // 4. Log the action
    const actionDescription = `User ${ClaimerEmail} submitted a claim for Item ID ${ItemID}${Message ? ` with message: "${Message}"` : ''}.`;

    await pool.request()
      .input('UserEmail', sql.NVarChar, ClaimerEmail)
      .input('ActionType', sql.NVarChar, 'ClaimItem')
      .input('ActionDescription', sql.NVarChar, actionDescription)
      .input('AffectedItemID', sql.Int, ItemID)
      .input('ActorRole', sql.NVarChar, ClaimerRole)
      .query(`
        INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, AffectedItemID, ActorRole)
        VALUES (@UserEmail, @ActionType, @ActionDescription, @AffectedItemID, @ActorRole)
      `);

    res.status(201).json({ message: 'Claim submitted, pending verification.' });

  } catch (err) {
    console.error('Claim error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
