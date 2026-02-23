require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');

async function test() {
  const connectionString = process.env.DATABASE_URL;
  console.log("URL:", connectionString);
  const pool = new Pool({ connectionString });
  try {
    const client = await pool.connect();
    console.log("Connected!");
    client.release();
  } catch(e) {
    console.error(e);
  }
}
test();
