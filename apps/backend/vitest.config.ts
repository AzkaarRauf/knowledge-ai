import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // fake values so src/env.ts passes validation. unit tests mock all services,
    // so these never reach a real db, s3, redis or google.
    // loadEnvFile does not override vars already set, so a local .env is ignored here
    env: {
      ENV: 'dev',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-jwt-secret',
      GOOGLE_API_KEY: 'test-google-api-key',
      AWS_ENDPOINT_URL_S3: 'http://localhost:9000',
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      AWS_REGION: 'us-east-1',
      S3_BUCKET: 'test-bucket',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/v1/auth/google/callback',
      REDIS_CONNECTION_STRING: 'redis://localhost:6379',
      PRISMA_PROVIDER: 'local',
    },
  },
});
