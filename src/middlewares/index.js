import compression from 'compression';
import cors from 'cors';
import promMid from 'express-prometheus-middleware';
import express from 'express'
import {checkRedisConnectionMiddleware} from './checkRedisConnectionMiddleware.js'

export default (app) => {
  app.use(cors());
  app.use(compression());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(
    promMid({
      metricsPath: '/metrics',
      requestDurationBuckets: [0.1, 0.5, 1, 1.5],
      requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
      responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
      authenticate: (req) =>
        //TODO: move to config
        req.headers.authorization === `Basic ${process.env.METRICS_AUTH_TOKEN}`,
    })
  );
  app.use(checkRedisConnectionMiddleware);
};
