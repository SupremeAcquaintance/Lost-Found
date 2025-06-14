const express = require('express'); 
const bcrypt = require('bcrypt');
const app = express.Router(); 

const { sql, poolPromise } = require('./config/config');


app.use(express.json());

app.post('/', async (req, res) => {
    const { Email, PasswordHash } = req.body;

    if (!Email || !PasswordHash) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const pool = await poolPromise; // ✅ use the shared pool
        console.log("Using shared pool to access database for login");

        const result = await pool.request()
            .input('Email', sql.NVarChar, Email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Account does not exist! Please Register.' });
        }

        const user = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(PasswordHash, user.PasswordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password!' });
        }

        // ✅ Log the successful login
        await pool.request()
            .input('Email', sql.NVarChar, Email)
            .query(`
                INSERT INTO ActivityLogs (UserEmail, ActionType, ActionDescription, ActorRole)
                VALUES (@Email, 'Login', 'User logged in successfully', 'user')
            `);

        return res.status(200).json({ message: 'Sign in successful!', user });

    } catch (error) {
        console.error('Error during sign in:', error);
        return res.status(500).json({ message: 'Sign in failed. Failed to render database connection.' });
    }
});

module.exports = app;
