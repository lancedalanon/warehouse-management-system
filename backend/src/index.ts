import app from '@/app';
import { AppDataSource } from './data-source';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('Data Source has been initialized!');
    } catch (error) {
      console.error('Error during Data Source initialization', error);
      process.exit(1);
    }
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap();
