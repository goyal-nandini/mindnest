import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

export default db;

// Why Pool, not Client?
// A Client opens one connection and if it drops, your app crashes.
// A Pool manages multiple connections automatically and reconnects. 
// On Render's free tier, this matters.

/*we used: import pg from "pg";
const db = new pg.Client({ ... });
db.connect();

This is a Client — it opens one single connection. It works for 
learning, but it's fragile for real apps. We're going to upgrade it 
to a Pool (handles multiple connections gracefully) — this is what
 every real Node/Postgres app uses. */