/**
 * prisma.config.ts
 * Prisma 6 configuration file — replaces the deprecated `prisma` key in package.json.
 * See: https://pris.ly/prisma-config
 *
 * NOTE: When prisma.config.ts is present, Prisma 6 skips automatic .env loading.
 * Prisma CLI commands that need DATABASE_URL must be prefixed with dotenv loading,
 * e.g.:  npx dotenv-cli -e .env -- npx prisma validate
 * Or set DATABASE_URL in the shell environment before running prisma commands.
 */
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx --env-file=.env prisma/seed.ts',
  },
});
