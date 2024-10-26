import express from 'express'
import Logger from "../common/logger.js";

const router = express.Router()
const logger = Logger.child({ module: 'imagesRouter.js' });
router.get(
  '/',
  async (req, res) => {
    try {
        const {Image} = req.app.locals.db.sequelize.models;
        const {limit = 10, offset= 10} = req.query;
        const images = await Image.findAll({limit, offset});
        res.json(images);
    } catch (error) {
        logger.error('Error retrieving images', error);
        res.status(500).json({ error: 'Failed to retrieve images' });
    }
  }
)

export default router
