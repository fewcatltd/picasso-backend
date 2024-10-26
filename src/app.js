import express from 'express';
import Redis from 'ioredis';
import { createServer } from 'http';
import configureMiddleware from './middlewares/index.js';
import configureRoutes from './routes/index.js';
import errorHandler from 'error-handler-json';
import Logger from './common/Logger.js';
import createDatabase from './database/index.js';
import sequelizeConfig from './common/sequelize-config.js';

const logger = Logger.child({ module: 'app.js' });

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy(times) {
        return Math.min(times * 2000, 10000);
    }
});
redis.on('error', (err) => {
    logger.error('Redis error:', err);
    //TODO: send alert to monitoring system
});

const initApp = async () => {
    try {
        // Дожидаемся завершения асинхронной инициализации базы данных
        const db = await createDatabase(sequelizeConfig, redis);

        // Проверка соединения с базой данных
        await db.sequelize.authenticate();
        logger.info('Database connection has been established successfully.');

        const app = express();
        app.locals.redis = redis;
        app.locals.db = db;

        configureMiddleware(app);
        configureRoutes(app, redis);

        app.use(errorHandler());

        const PORT = process.env.PORT || 3001;
        const HOST = process.env.HOST || '0.0.0.0';
        const server = createServer(app);

        server.listen(PORT, HOST, () => {
            logger.info(`Server is running on port ${PORT}, host ${HOST}`);
        });

        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, shutting down gracefully...');
            server.close(async () => {
                logger.info('Server closed.');
                if (redis.status === 'ready') {
                    await redis.quit(); // Закрываем соединение Redis
                    logger.info('Redis connection closed.');
                }
                process.exit(0);
            });

            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down.');
                process.exit(1);
            }, 10000);
        });

        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Database connection error', error);
        process.exit(-1);
    }
};

initApp();

export default initApp;
