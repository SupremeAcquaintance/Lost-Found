// test database connection
const connectDB = require('./config');
const sql = require('mssql'); // Import mssql for SQL Server connection

async function testConnection() {
    try {
        await connectDB(); // Call the connectDB function to establish the connection
        console.log('Database connection successful');
    } catch (error) {
        console.error('Database connection failed:', error.message);
    } finally {
        // Since connectDB does not return a connection object, we cannot close it here.
        // If you want to close the connection, you need to modify connectDB to return the connection.
        // await sql.close(); // Uncomment this if you modify connectDB to return the connection
        try { await sql.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
}

testConnection();