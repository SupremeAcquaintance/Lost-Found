const express = require('express');
const { sql, poolPromise } = require('./config/config');
const app = express.Router();

app.use(express.json());

// Fetch user profile
app.get('/', async (req, res) => {
    const { Email } = req.query;

    if (!Email) {
        console.log('Email is required');
        return res.status(400).send('Email is required');
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Email', sql.NVarChar, Email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        if (result.recordset.length === 0) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Server Error');
    }
});

// Edit user profile and log the activity
app.put('/edit', async (req, res) => {
    const { Email, Username, Phone, Residence, UserType } = req.body;

    if (!Email || !Username || !Phone || !Residence || !UserType) {
        console.log('Missing required fields');
        return res.status(400).send('Email, Username, Phone, Residence, and UserType are required');
    }

    try {
        const pool = await poolPromise;

        const updateResult = await pool.request()
            .input('Username', sql.NVarChar, Username)
            .input('Phone', sql.NVarChar, Phone)
            .input('Residence', sql.NVarChar, Residence)
            .input('Email', sql.NVarChar, Email)
            .query(`
                UPDATE Users 
                SET Username = @Username, Phone = @Phone, Residence = @Residence, UpdatedAt = GETDATE() 
                WHERE Email = @Email
            `);

        if (updateResult.rowsAffected[0] === 0) {
            console.log('User Profile not found for update');
            return res.status(404).send('User Profile not found for update');
        }

        const actionType = 'Profile Update';
        const actionDescription = `User updated profile: Username=${Username}, Phone=${Phone}, Residence=${Residence}`;

        await pool.request()
            .input('Email', sql.NVarChar, Email)
            .input('ActionType', sql.NVarChar, actionType)
            .input('ActionDescription', sql.NVarChar, actionDescription)
            .input('ActorRole', sql.NVarChar, UserType)
            .query(`
                INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, Timestamp, AffectedItemID, ActorRole)
                VALUES (@Email, @ActionType, @ActionDescription, GETDATE(), NULL, @ActorRole)
            `);

        console.log('User profile updated and activity logged');
        res.status(200).send('User profile updated and activity logged successfully');

    } catch (error) {
        console.error('Error updating user profile or logging activity:', error);
        res.status(500).send('Server Error');
    }
});

// Fetch activity logs
app.get('/activity-log', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email parameter is required' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT 
                    LogID,
                    UserEmail,
                    ActionType,
                    ActionDescription AS ActionDetails,
                    Timestamp,
                    ActorRole
                FROM ActivityLogs
                WHERE UserEmail = @email
                ORDER BY Timestamp DESC
            `);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

module.exports = app;
