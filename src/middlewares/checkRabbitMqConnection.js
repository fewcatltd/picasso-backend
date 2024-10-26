import {isRabbitConnected} from "../services/amqpService.js";
import Logger from "../common/logger.js";

const logger = Logger.child({module: 'checkRabbitMqConnection.js'});

export default async (req, res, next) => {
    if(isRabbitConnected()) {
        return next();
    }
    logger.error('Service Unavailable: RabbitMQ is not connected');
    return res.status(503).send('Service Unavailable: RabbitMQ is not connected');
}
