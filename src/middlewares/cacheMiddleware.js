import hash from 'object-hash'
import Logger from '../common/Logger.js'

const logger = Logger.child({module: 'cacheMiddleware.js'})
const getKey = (req) => {
  const {method, url, query, body, params} = req
  return hash({method, url, query, body, params})
}

export const cacheMiddleware = (options = { EX: 60 }) => async (req, res, next) => {
  const { redis } = req.app.locals;
  if (!redis) {
    logger.debug('Redis is not connected')
    return next();
  }

  try {
    const key = getKey(req);
    const cachedData = await redis.get(key);
    if (cachedData) {
      try {
        return res.send(JSON.parse(cachedData));
      } catch (e) {
        logger.error('Error parsing cached data:', e)
        return res.send(cachedData);
      }
    }
    const originalSend = res.send.bind(res);
    res.send = (data) => {
      res.send = originalSend;
      if (res.statusCode.toString().startsWith('2')) {
        //TODO можно написать лучше. тут не используются опции
        redis.set(key, JSON.stringify(data), 'EX', options.EX).catch((err) => {
          logger.error('Error setting cache:', err)
        });
      }
      res.send(data);
    };
    next();
  } catch (e) {
    logger.error('Error', e);
    next();
  }
};
