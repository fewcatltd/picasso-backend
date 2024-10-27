import express from 'express';
import Redis from 'ioredis';
import configureMiddleware from './middlewares/index.js';
import configureRoutes from './routes/index.js';
import errorHandler from 'error-handler-json';
import Logger from './common/logger.js';
import createDatabase from './database/index.js';
import sequelizeConfig from './common/sequelize-config.js';
import Config from "./common/сonfig.js";
import {initRabbitMQ} from "./services/amqpService.js";
import {createRequire} from "module";

const apiMetrics = createRequire(import.meta.url)("prometheus-api-metrics");

const logger = Logger.child({module: 'app.js'});

const initApp = async (options = {}) => {
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
        if (!options.skipMetrics) {
            app.use(apiMetrics());
        }
        configureRoutes(app, redis);

        app.use(errorHandler());

        return app;
    } catch (error) {
        logger.error('Database connection error', error);
        process.exit(-1);
    }
};

initApp();

export default initApp;
