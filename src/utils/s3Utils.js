import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import Config from '../common/Config.js';
import Logger from '../common/Logger.js';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);
const logger = Logger.child({ module: 's3Utils.js' });

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms));

const s3 = new S3Client({
  region: Config.s3.region,
  endpoint: `https://${Config.s3.endpoint}`,
  credentials: {
    accessKeyId: Config.s3.accessKeyId,
    secretAccessKey: Config.s3.secretAccessKey,
  },
});

async function uploadToS3(gifResponse, gifKey, contentLength, contentType, t, Image, imageId) {
  await Promise.race([
    streamPipeline(
      gifResponse.data,
      async (source) => {
        await s3.send(
          new PutObjectCommand({
            Bucket: Config.s3.bucketName,
            Key: gifKey,
            Body: source,
            ContentLength: contentLength,
            ContentType: contentType,
            ACL: 'public-read',
          })
        );
      }
    ),
    timeout(10000), // Timeout for S3 upload
  ]).catch(async (err) => {
    logger.error('Stream pipeline failed', err);
    await Image.destroy({ where: { id: imageId }, transaction: t });
    throw err;
  });
}

export default { uploadToS3 };
