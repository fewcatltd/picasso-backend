export const checkRedisConnectionMiddleware = (req, res, next) => {
  const redis = req.app.locals.redis;
  if (!redis) {
    return res.status(503).send('Service Unavailable: Redis is not connected');
  }
  if (redis.status !== 'ready') {
    return res.status(503).send('Service Unavailable: Redis is not connected');
  }
  next();
};
