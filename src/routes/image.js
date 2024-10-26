import express from 'express';
import gifService from '../services/gifService.js';
import Logger from '../common/logger.js';

const logger = Logger.child({ module: 'imageRouter.js' });
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const images = await gifService.createGifImages(req.app.locals.db);
    res.json(images);
  } catch (error) {
    logger.error('Error creating image', error);
    res.status(500).json({ error: 'Failed to create image' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const image = await gifService.getImageById(req.app.locals.db, req.params.id);
    if (!image) {

      return res.status(404).json({ error: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    logger.error('Error retrieving image', error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

export default router;
