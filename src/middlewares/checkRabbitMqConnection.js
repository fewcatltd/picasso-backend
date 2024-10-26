import {getConnection} from "../services/amqpService.js";
import Logger from "../common/logger.js";

const logger = Logger.child({module: 'checkRabbitMqConnection.js'});

export default async (req, res, next) => {
    const connection = await getConnection();
    if (connection && connection.connectionState === 'open') {
        next();
    }
    logger.error('Service Unavailable: RabbitMQ is not connected');
    return res.status(503).send('Service Unavailable: RabbitMQ is not connected');
}
