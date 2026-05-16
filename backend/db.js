// backend/db.js
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             Number(process.env.DB_PORT),
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.getConnection()
  .then((connection) => {
    console.log("✅ MySQL Connected (Aiven)");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ MySQL Error", err);
  });

module.exports = pool;