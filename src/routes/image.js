import express from 'express';
import gifService from '../services/gifService.js';
import Logger from '../common/logger.js';

const logger = Logger.child({ module: 'imageRouter.js' });
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const gifs = await gifService.pushGifsToQueue();
    res.json(gifs);
  } catch (error) {
    logger.error('Error creating image', error);
    res.status(500).json({ error: 'Failed to create image' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const {Image} = req.app.locals.db.sequelize.models;
    const image = await Image.findByPk(req.params.id);
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
