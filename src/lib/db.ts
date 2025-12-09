import { neon } from '@neondatabase/serverless';

// Use the DATABASE_URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

export const sql = neon(databaseUrl);
