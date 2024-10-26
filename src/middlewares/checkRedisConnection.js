export default async (req, res, next) => {
    const {redis} = req.app.locals;
    if (!redis) {
        return res.status(503).send('Service Unavailable: Redis is not connected');
    }
    if (redis.status !== 'ready') {
        return res.status(503).send('Service Unavailable: Redis is not connected');
    }
    next();
}
