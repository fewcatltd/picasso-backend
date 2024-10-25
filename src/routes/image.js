import express from 'express'
import axios from 'axios'
import Config from '../common/Config.js'
import axiosRetry from 'axios-retry'
import Logger from '../common/Logger.js'
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {v4 as uuidv4} from 'uuid';
import {promisify} from 'util';
import {pipeline} from 'stream';

const streamPipeline = promisify(pipeline);

const logger = Logger.child({module: 'image.js'})
const router = express.Router()

const s3 = new S3Client({
    region: Config.s3.region,
    endpoint: `https://${Config.s3.endpoint}`,
    credentials: {
        accessKeyId: Config.s3.accessKeyId,
        secretAccessKey: Config.s3.secretAccessKey
    }
});
const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms));
router.post(
    '/',
    async (req, res) => {
        try {

            const {db} = req.app.locals;
            const {Image} = db.sequelize.models;
            const giphyResponse = await axios.get(`${Config.giphy.url}/gifs/random?api_key=${Config.giphy.apiKey}`, {
                validateStatus: (status) => status >= 200 && status < 300
            });

            if (!giphyResponse.data || !giphyResponse.data.data) {
                return res.status(500).json({error: 'Invalid response from Giphy API'});
            }

            const giphyData = giphyResponse.data.data;

            if (!giphyData.images || !giphyData.images.downsized_still || !giphyData.images.downsized_still.url) {
                return res.status(500).json({error: 'Image URL is missing in the Giphy response'});
            }

            const gifUrls = [
                {
                    type: 'downsized_still',
                    url: giphyData.images.downsized_still.url,
                },
                {
                    type: 'fixed_height_small_still',
                    url: giphyData.images.fixed_height_small_still.url,
                },
                {
                    type: 'fixed_width_small_still',
                    url: giphyData.images.fixed_width_small_still.url,
                }
            ];

            const images = await db.sequelize.transaction(async (t) => {
                const uploadPromises = gifUrls.map(async ({type, url, size}) => {
                    const gifKey = `gifs/${giphyData.id}-${type}-${uuidv4()}.gif`;
                    const [image, created] = await Image.findOrCreate({
                        where: {
                            id: `${giphyData.id}-${type}`,
                        },
                        defaults: {
                            id: `${giphyData.id}-${type}`,
                            url: `https://${Config.s3.bucketName}.${Config.s3.endpoint}/${gifKey}`,
                            title: giphyData.title || 'Untitled'
                        },
                        transaction: t
                    });

                    if (!created) {
                        return image;
                    }

                    const giphyClient = axios.create();
                    axiosRetry(giphyClient, {retries: 3, retryDelay: axiosRetry.exponentialDelay});

                    const gifResponse = await giphyClient({
                        method: 'get',
                        url,
                        responseType: 'stream',
                        validateStatus: (status) => status >= 200 && status < 300
                    });

                    if (!gifResponse || !gifResponse.data) {
                        throw new Error('Invalid response from Giphy API');
                    }

                    await Promise.race([
                        streamPipeline(
                            gifResponse.data,
                            async (source) => {
                                await s3.send(new PutObjectCommand({
                                    Bucket: Config.s3.bucketName,
                                    Key: gifKey,
                                    Body: source,
                                    ContentLength: gifResponse.headers['content-length'],
                                    ContentType: gifResponse.headers['content-type'],
                                    ACL: 'public-read'
                                }));
                            }
                        ),
                        timeout(10000) // Таймаут 10 секунд для загрузки в S3
                    ]).catch(async (err) => {
                        logger.error('Stream pipeline failed', err);
                        await Image.destroy({where: {id: `${giphyData.id}-${type}`}, transaction: t});
                        throw err;
                    });

                    return image;
                });

                return await Promise.all(uploadPromises);
            });

            res.json(images);
        } catch (error) {
            logger.error('Error creating image', error);
            res.status(500).json({error: 'Failed to create image'});
        }
    }
);

router.get(
    '/:id',

    async (req, res) => {
        try {
            const {Image} = req.app.locals.db.sequelize.models;
            const image = await Image.findByPk(req.params.id);
            if (!image) {
                return res.status(404).json({error: 'Image not found'});
            }
            res.json(image);
        } catch (error) {
            logger.error('Error retrieving image', error);
            res.status(500).json({error: 'Failed to retrieve image'});
        }
    }
)

export default router
