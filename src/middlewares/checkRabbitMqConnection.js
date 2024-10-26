import {getConnection} from "../services/amqpService.js";

export default async (req, res, next) => {
    const connection = await getConnection();
    if (connection && connection.connectionState === 'open') {
        next();
    }
    return res.status(503).send('Service Unavailable: RabbitMQ is not connected');
}
