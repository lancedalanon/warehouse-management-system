import 'reflect-metadata';
import './container';
import express from 'express';
import qs from 'qs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from '@/routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/swagger';
import { globalExceptionHandler } from '@/middlewares/exception.middleware';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();

// Allow requests with no origin (like mobile apps, curl, Postman)
const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.set('query parser', (str: string) => qs.parse(str, { allowDots: true }));
app.use(express.json());
app.use(cookieParser());

let frontendDistDir: string;

if (process.env.NODE_ENV === 'development') {
  // Local dev path
  frontendDistDir = path.resolve(__dirname, '../../frontend/dist');
} else {
  // Docker / production path
  frontendDistDir = path.resolve(process.cwd(), 'frontend/dist');
}

if (fs.existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir));

  // Fallback for React Router (exclude /api and /storage)
  app.get(/^(?!\/api|\/storage).*/, (_req, res) =>
    res.sendFile('index.html', { root: frontendDistDir }, (err) => {
      if (err) {
        console.error('Failed to send index.html:', err);
        res.status(500).send('Internal Server Error');
      }
    }),
  );
} else {
  app.get('/', (_req, res) => res.send('OK'));
}

// Swagger docs
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// API routes
app.use('/api', routes);

// Global exception handler
app.use(globalExceptionHandler);

export default app;
