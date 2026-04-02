import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import path from 'path';

dotenv.config();

// Determine if we should use DATABASE_URL (Supabase / hosted)
const useDatabaseUrl = Boolean(process.env.DATABASE_URL);

const commonConfig = {
  type: 'postgres' as const,
  entities: [path.join(__dirname, 'entities', '*.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: false,
  namingStrategy: new SnakeNamingStrategy(),
};

const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER || 'test',
  password: process.env.DB_PASSWORD || 'test',
  database: process.env.DB_NAME || 'test',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const remoteConfig = {
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
};

export const AppDataSource = new DataSource({
  ...commonConfig,
  ...(useDatabaseUrl ? remoteConfig : localConfig),
});
