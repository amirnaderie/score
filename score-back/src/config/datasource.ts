import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Determine which environment file to load
const NODE_ENV = process.env.NODE_ENV || 'dev';
const envFile = `.env.${NODE_ENV}`;

console.log('NODE_ENV:', NODE_ENV);
console.log('Looking for environment file:', envFile);

// Try multiple possible locations for the env file
const possiblePaths = [
  path.resolve(__dirname, '../../', envFile),           // src/config -> root
  path.resolve(__dirname, '../../../', envFile),        // if nested deeper
  path.resolve(process.cwd(), envFile),                 // current working directory
  path.resolve(__dirname, envFile),                     // same directory as datasource
];

let envLoaded = false;
let loadedFromPath = '';

for (const envPath of possiblePaths) {
  console.log('Trying path:', envPath);
  
  if (fs.existsSync(envPath)) {
    console.log('Found environment file at:', envPath);
    const result = dotenv.config({ path: envPath });
    
    if (!result.error) {
      envLoaded = true;
      loadedFromPath = envPath;
      console.log('Successfully loaded environment file from:', envPath);
      break;
    } else {
      console.log('Error loading from', envPath, ':', result.error.message);
    }
  } else {
    console.log('File does not exist at:', envPath);
  }
}

if (!envLoaded) {
  console.log('Could not find or load environment file. Listing current directory contents:');
  try {
    const files = fs.readdirSync(process.cwd());
    console.log('Files in current directory:', files.filter(f => f.startsWith('.env')));
  } catch (e) {
    console.log('Could not list directory contents');
  }
}

// Debug: Log the environment variables to ensure they're loaded
console.log('\n=== Environment variables check ===');
console.log('Loaded from:', loadedFromPath || 'NOT LOADED');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('DB_USERNAME:', process.env.DB_USERNAME ? '***SET***' : 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');

if (!process.env.DB_HOST) {
  console.error(`\nERROR: DB_HOST environment variable is not set.`);
  console.error(`Please ensure your ${envFile} file exists and contains the required variables.`);
  throw new Error(`DB_HOST environment variable is not set. Please check your ${envFile} file.`);
}

// Create the configuration using the 'extra' property to pass tedious-specific options
const config = {
  type: 'mssql' as const,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1433,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '../', '**/*.entity.{ts,js}')],
  migrations: [join(__dirname, '../migrations/*.{ts,js}')],
  synchronize: false,
  logging: true,
  extra: {
    // Directly configure the tedious driver
    server: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 1433,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      database: process.env.DB_NAME,
    },
    authentication: {
      type: 'default',
      options: {
        userName: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
      },
    },
  },
};

console.log('\n=== DataSource Configuration ===');
console.log('Type:', config.type);
console.log('Host:', config.host);
console.log('Port:', config.port);
console.log('Database:', config.database);
console.log('Extra.server:', config.extra.server);

export const AppDataSource = new DataSource(config);