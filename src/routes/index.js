import imagesRouter from './images.js';
import imageRouter from './image.js';
import healthRouter from './health.js';

export default (app) => {
  app.use(
    '/images',
    imagesRouter
  );

  app.use(
    '/image',
    imageRouter
  );

  app.use(
    '/health',
    healthRouter
  );
};
