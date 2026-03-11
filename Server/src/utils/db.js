import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection when the file loads
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to Neon PostgreSQL:', err);
  } else {
    console.log('Connected to Neon PostgreSQL Database!');
  }
});

export default pool;