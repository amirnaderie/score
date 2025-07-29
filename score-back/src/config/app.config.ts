import { registerAs } from "@nestjs/config";

export default registerAs('appConfig', () => {
  return {
    environment: process.env.NODE_ENV || 'production',
    port: process.env.APP_PORT,
    corsOrigin: process.env.CORS_ORIGINS,
    coockieDomain: process.env.COOKIE_DOMAIN
  }
});