require("dotenv").config();

const { Pool } = require("pg");

console.log(
  "PostgreSQL host:",
  process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).hostname
    : "DATABASE_URL missing"
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

module.exports = pool;