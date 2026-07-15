import dotenv from 'dotenv'

dotenv.config()

// Central config, all from environment (see server/.env.example).
export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  authProvider: process.env.AUTH_PROVIDER || 'sample',
  // Comma-separated allowed origins for CORS in split dev (client on :5173).
  clientOrigin: process.env.CLIENT_ORIGIN || '',
  cookieName: 'vcm_session',
  isProd: process.env.NODE_ENV === 'production',
  // Microsoft Entra (Azure AD) — placeholders for the not-yet-wired provider.
  entra: {
    tenantId: process.env.ENTRA_TENANT_ID || '',
    clientId: process.env.ENTRA_CLIENT_ID || '',
    clientSecret: process.env.ENTRA_CLIENT_SECRET || '',
    redirectUri: process.env.ENTRA_REDIRECT_URI || '',
  },
}

// When no Mongo URI is configured, the server falls back to an in-memory
// repository so it runs (and is testable) with zero external dependencies.
export const useMongo = Boolean(config.mongoUri)
