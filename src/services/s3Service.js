import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import axios from 'axios';
import Config from "../common/сonfig.js";
import Logger from "../common/logger.js";

const logger = Logger.child({module: 's3Service.js'});

const s3Client = new S3Client({
    region: Config.s3.region,
    endpoint: `https://${Config.s3.endpoint}`,
    credentials: {
        accessKeyId: Config.s3.accessKeyId,
        secretAccessKey: Config.s3.secretAccessKey,
    },
});

export async function streamToS3(gifData) {
    logger.info(`Uploading GIF to S3: ${gifData.url}`);
    const {url, id, format, type} = gifData;
    const response = await axios.get(url, {responseType: 'stream'});
    const key = `gifs/${id}_${type}.${format}`;

    const uploadParams = {
        Bucket: Config.s3.bucketName,
        Key: key,
        Body: response.data,
        ContentType: response.headers['content-type'],
        ContentLength: response.headers['content-length'],
        ACL: 'public-read',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    const s3Url = `https://${Config.s3.bucketName}.${Config.s3.region}.digitaloceanspaces.com/${key}`;
    logger.info(`Uploaded GIF to S3: ${s3Url}`);
    return s3Url;
}
