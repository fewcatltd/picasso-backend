import express from 'express'
import Logger from "../common/logger.js";
import {Op} from "sequelize";
import Config from "../common/сonfig.js";

const router = express.Router()
const logger = Logger.child({module: 'imagesRouter.js'});
router.get('/', async (req, res) => {
    try {
        const {Image} = req.app.locals.db.sequelize.models;
        const {limit = 10, offset = 0, sort = 'desc'} = req.query

        const where = {
            s3Url: {[Op.not]: null},
        };

        if (req.query.startDate || req.query.endDate) {
            where.createdAt = {
                ...(req.query.startDate ? {[Op.gte]: new Date(req.query.startDate)} : {}), ...(req.query.endDate ? {[Op.lte]: new Date(req.query.endDate)} : {}),
            };
        }

        if (req.query.minWidth || req.query.maxWidth) {
            where.width = {
                ...(req.query.minWidth ? {[Op.gte]: parseInt(req.query.minWidth)} : {}), ...(req.query.maxWidth ? {[Op.lte]: parseInt(req.query.maxWidth)} : {}),
            };
        }

        if (req.query.minHeight || req.query.maxHeight) {
            where.height = {
                ...(req.query.minHeight ? {[Op.gte]: parseInt(req.query.minHeight)} : {}), ...(req.query.maxHeight ? {[Op.lte]: parseInt(req.query.maxHeight)} : {}),
            };
        }

        if (req.query.format) {
            where.format = req.query.format;
        }

        const rawImages = await Image.findAll({
            where, limit, offset, order: [['createdAt', sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC']],
        });
        const images = rawImages.map(image => {
            return {
                id: image.id,
                giphyId: image.giphyId,
                title: image.title,
                url: `${Config.microservices.apiGateway.externalUrl}/image/${image.id}`,
                width: image.width,
                height: image.height,
                format: image.format,
                type: image.type,
                createdAt: image.createdAt,
            };
        });
        res.json(images);
    } catch (error) {
        logger.error('Error retrieving images', error);
        res.status(500).json({error: 'Failed to retrieve images'});
    }
})

export default router
