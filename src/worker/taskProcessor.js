import {streamToS3} from '../services/s3Service.js';
import {taskCounter, errorCounter} from '../services/metricsService.js';
import pLimit from 'p-limit';
import Logger from '../common/logger.js';
import Config from "../common/сonfig.js";
import {consumeQueue, getChannel} from "../services/amqpService.js";

const logger = Logger.child({module: 'taskProcessor.js'});
const limit = pLimit(Config.worker.maxConcurrentTasks);

async function processTask(channel, msg, db) {
    await limit(async () => {
        try {
            logger.info('Processing task');
            const gifData = JSON.parse(msg.content.toString());
            const {id: giphyId, format, type, width, height, title} = gifData;
            // Проверяем, есть ли уже запись в базе
            const [image, created] = await db.sequelize.models.Image.findOrCreate({
                where: {giphyId, format, type},
                defaults: {
                    giphyId,
                    title,
                    width: Number(width) || 0,
                    height: Number(height) || 0,
                    format,
                    type
                },
            });

            if (!created && image.s3Url) {
                logger.info(`Image with giphyId ${giphyId}, format ${format}, and type ${type} already exists. Skipping upload.`);
                channel.ack(msg);
                return;
            }

            // Если записи нет, загружаем на S3 и обновляем запись в базе
            const s3Url = await streamToS3(gifData)
                .catch(async (error) => {
                    logger.error(`Failed to upload GIF to S3: ${giphyId}`, error);
                    await db.sequelize.models.Image.destroy({where: {giphyId, format, type}});
                    throw error;
                });
            await image.update({s3Url});

            taskCounter.inc();
            channel.ack(msg);
            logger.info(`Successfully processed and uploaded GIF: ${giphyId}`);
        } catch (error) {
            logger.error(`Failed to process GIF`, error);
            errorCounter.inc();
            channel.nack(msg, false, true);

        }
    });
}

export async function initTaskProcessor(db) {
    const channel = await getChannel(Config.rabbitmq.queueName);
    await consumeQueue(Config.rabbitmq.queueName, (msg) => processTask(channel, msg, db));
}
