import { SignOptions } from 'jsonwebtoken';

export const getJwtSecret = (value?: string): string =>
  value ?? 'change-me-in-development';

export const getJwtExpiresIn = (value?: string): SignOptions['expiresIn'] =>
  (value ?? '1d') as SignOptions['expiresIn'];
