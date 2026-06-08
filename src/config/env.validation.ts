const DEFAULT_PORT = 3000;
const DEFAULT_DB_PORT = 5432;
const DEFAULT_JWT_EXPIRES_IN = '1d';
const DEFAULT_THROTTLE_TTL = 60000;
const DEFAULT_THROTTLE_LIMIT = 100;

type RawEnv = Record<string, string | undefined>;

const required = (env: RawEnv, key: string): string => {
  const value = env[key];

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
};

const numberValue = (
  env: RawEnv,
  key: string,
  defaultValue: number,
): number => {
  const value = env[key];

  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsed;
};

export const validateEnv = (config: RawEnv) => {
  const jwtSecret = required(config, 'JWT_SECRET');

  if (jwtSecret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters long');
  }

  return {
    ...config,
    PORT: numberValue(config, 'PORT', DEFAULT_PORT),
    DB_HOST: required(config, 'DB_HOST'),
    DB_PORT: numberValue(config, 'DB_PORT', DEFAULT_DB_PORT),
    DB_USERNAME: required(config, 'DB_USERNAME'),
    DB_PASSWORD: required(config, 'DB_PASSWORD'),
    DB_NAME: required(config, 'DB_NAME'),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN ?? DEFAULT_JWT_EXPIRES_IN,
    CORS_ORIGIN: config.CORS_ORIGIN,
    THROTTLE_TTL: numberValue(config, 'THROTTLE_TTL', DEFAULT_THROTTLE_TTL),
    THROTTLE_LIMIT: numberValue(
      config,
      'THROTTLE_LIMIT',
      DEFAULT_THROTTLE_LIMIT,
    ),
    SEED_USER_NAME: config.SEED_USER_NAME,
    SEED_USER_EMAIL: config.SEED_USER_EMAIL,
    SEED_USER_PASSWORD: config.SEED_USER_PASSWORD,
  };
};
