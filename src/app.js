import express from 'express';
import Redis from 'ioredis';
import {createServer} from 'http';
import configureMiddleware from './middlewares/index.js';
import configureRoutes from './routes/index.js';
import errorHandler from 'error-handler-json';
import Logger from './common/logger.js';
import createDatabase from './database/index.js';
import sequelizeConfig from './common/sequelize-config.js';
import Config from "./common/сonfig.js";
import {closeConnection, initRabbitMQ} from "./services/amqpService.js";
import gracefulShutdown from "./common/gracefulShutdown.js";

const logger = Logger.child({module: 'app.js'});

const initApp = async () => {
    try {
        const redis = new Redis(Config.redis.url, {
            retryStrategy(times) {
                return Math.min(times * 2000, 10000);
            }
        });
        redis.on('error', (err) => logger.error('Redis error:', err));

        const db = await createDatabase(sequelizeConfig, redis);
        await db.sequelize.authenticate();
        logger.info('Database connection has been established successfully.');

        await initRabbitMQ();

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

        gracefulShutdown(server, async () => {
            if (redis.status === 'ready') {
                await redis.quit();
            }
            await db.sequelize.close();
            await closeConnection();
        })

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
