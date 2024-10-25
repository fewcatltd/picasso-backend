import axios from 'axios';
import axiosRetry from 'axios-retry';
import Config from '../common/Config.js';
import s3Utils from '../utils/s3Utils.js';
import Logger from '../common/Logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = Logger.child({ module: 'gifService.js' });

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms));

// Function to get random GIF from Giphy
async function getRandomGif() {
  const response = await axios.get(`${Config.giphy.url}/gifs/random?api_key=${Config.giphy.apiKey}`, {
    validateStatus: (status) => status >= 200 && status < 300,
  });
  if (!response.data || !response.data.data) {
    throw new Error('Invalid response from Giphy API');
  }
  return response.data.data;
}

// Function to create or find image in DB
async function findOrCreateImage(Image, gifId, type, gifKey, title, t) {
  const [image, created] = await Image.findOrCreate({
    where: {
      id: `${gifId}-${type}`,
    },
    defaults: {
      id: `${gifId}-${type}`,
      url: `https://${Config.s3.bucketName}.${Config.s3.endpoint}/${gifKey}`,
      title: title || 'Untitled',
    },
    transaction: t,
  });
  return { image, created };
}

async function createGifImages(db) {
  const { Image } = db.sequelize.models;
  const giphyData = await getRandomGif();

  if (!giphyData.images) {
    throw new Error('Image URL is missing in the Giphy response');
  }

  const gifUrls = [
    { type: 'downsized_still', url: giphyData.images?.downsized_still?.url },
    { type: 'fixed_height_small_still', url: giphyData.images?.fixed_height_small_still?.url },
    { type: 'fixed_width_small_still', url: giphyData.images?.fixed_width_small_still?.url },
  ];

  return await db.sequelize.transaction(async (t) => {
    const uploadPromises = gifUrls.map(async ({ type, url }) => {
      const gifKey = `gifs/${giphyData.id}-${type}-${uuidv4()}.gif`;
      if(url === undefined) {
        throw new Error('Image URL is missing in the Giphy response');
      }

      const { image, created } = await findOrCreateImage(Image, giphyData.id, type, gifKey, giphyData.title, t);

      if (!created) {
        return image;
      }

      const giphyClient = axios.create();
      axiosRetry(giphyClient, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

      const gifResponse = await giphyClient({
        method: 'get',
        url,
        responseType: 'stream',
        validateStatus: (status) => status >= 200 && status < 300,
      });

      if (!gifResponse || !gifResponse.data) {
        throw new Error('Invalid response from Giphy API');
      }

      gifResponse.data.on('error', (err) => {
        logger.error('Error while streaming the image', err);
        throw err;
      });

      logger.info(`Uploading image ${gifKey} to S3`);
      await s3Utils.uploadToS3(gifResponse, gifKey, gifResponse.headers['content-length'], gifResponse.headers['content-type'], t, Image, `${giphyData.id}-${type}`);

      return image;
    });

    return await Promise.all(uploadPromises);
  });
}

async function getImageById(db, id) {
  const { Image } = db.sequelize.models;
  return await Image.findByPk(id);
}

export default { createGifImages, getImageById };
