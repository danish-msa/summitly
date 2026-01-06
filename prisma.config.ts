// Conditionally load dotenv for local development
// Vercel and other platforms provide environment variables directly
if (!process.env.DATABASE_URL && !process.env.VERCEL) {
  try {
    // Only load dotenv if DATABASE_URL is not set and we're not on Vercel
    // This allows local development to work with .env.local
    require('dotenv/config');
  } catch (error) {
    // dotenv not available - that's fine, env vars should be provided by the platform
    // This is expected in production builds on Vercel
  }
}

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use env() which will throw if DATABASE_URL is not set
    // This ensures we fail fast if the database URL is missing
    url: env("DATABASE_URL"),
  },
});

