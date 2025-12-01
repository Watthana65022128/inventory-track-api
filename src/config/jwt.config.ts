import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '3600', // in seconds
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '604800', // 7 days in seconds
}));
