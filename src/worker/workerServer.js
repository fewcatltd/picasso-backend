import express from 'express';
import Logger from '../common/logger.js';
import {initTaskProcessor} from './taskProcessor.js';
import createDatabase from "../database/index.js";
import sequelizeConfig from "../common/sequelize-config.js";
import {createServer} from "http";
import {createRequire} from "module";
import {closeConnection, initRabbitMQ} from "../services/amqpService.js";
import checkDbConnection from "../middlewares/checkDbConnection.js";
import checkRabbitMqConnection from "../middlewares/checkRabbitMqConnection.js";
import gracefulShutdown from "../common/gracefulShutdown.js";

const apiMetrics = createRequire(import.meta.url)("prometheus-api-metrics");

const logger = Logger.child({module: 'workerServer.js'});
const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function startWorkerServer() {
    const db = await createDatabase(sequelizeConfig);
    await db.sequelize.authenticate()
        .then(() => logger.info('Database connection has been established successfully.'))
        .catch((error) => logger.error('Unable to connect to the database:', error) || process.exit(-1));

    app.locals.db = db;

    await initRabbitMQ();
    await initTaskProcessor(db)

    app.use(apiMetrics());

    app.get('/health/liveness',
        checkDbConnection,
        checkRabbitMqConnection,
        (req, res) => {
            res.send('OK');
        });
    app.get('/health/readiness',
        (req, res) => {
            res.send('OK');
        });

    const server = createServer(app);
    server.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}, host ${HOST}`);
    });

    gracefulShutdown(server, async () => {
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
}

startWorkerServer().catch((err) => {
    logger.error('Failed to start worker server', err);
    process.exit(1);
});
