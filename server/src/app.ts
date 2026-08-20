import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { apiRouter } from './routes';
import { swaggerSpec } from './swagger';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  // CORS restricted to configured browser origins for the web chat client.
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS.'));
        }
      },
    }),
  );

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // JSON body parsing. The Stripe webhook route swaps in raw parsing.
  app.use(express.json());

  app.use('/api', apiRouter);

  // API documentation (Swagger UI). The raw spec is also available as JSON.
  if (env.NODE_ENV !== 'production') {
    app.get('/api-docs.json', (_req, res) => {
      res.json(swaggerSpec);
    });
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // 404 for anything unmatched.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found.' },
    });
  });

  // Errors are normalized to the API envelope.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    errorMiddleware(err, _req, res, _next);
  });

  return app;
}