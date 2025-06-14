// config.js
const sql = require('mssql');

const config = {
  user: 'supreme',
  password: '1234',
  server: 'supremeacquinta',
  database: 'lost_and_found',
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  requestTimeout: 15000
};

// Create a single shared pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to Microsoft SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('Database connection error:', err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise
};
