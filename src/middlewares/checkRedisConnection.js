import Logger from "../common/logger.js";

const logger = Logger.child({module: 'checkRedisConnection.js'});

export default async (req, res, next) => {
    const {redis} = req.app.locals;
    if (!redis) {
        logger.error('Service Unavailable: Redis not initialized');
        return res.status(503).send('Service Unavailable: Redis is not connected');
    }
    if (redis.status !== 'ready') {
        logger.error('Service Unavailable: Redis is not connected');
        return res.status(503).send('Service Unavailable: Redis is not connected');
    }
    next();
}
