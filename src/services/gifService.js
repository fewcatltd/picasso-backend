import axios from 'axios';
import Config from "../common/сonfig.js";
import {sendToQueue} from "./amqpService.js";
import logger from "../common/logger.js";

async function getRandomGif() {
    const response = await axios.get(`${Config.giphy.url}/gifs/random?api_key=${Config.giphy.apiKey}`);
    if (!response.data || !response.data.data) {
        throw new Error('Invalid response from Giphy API');
    }
    return response.data.data;
}

async function pushGifsToQueue() {
    const giphyData = await getRandomGif();
    if (!giphyData.images) {
        logger.child({module: 'gifService.js'}).error('Invalid response from Giphy API');
        return []
    }

    const gifs = Object.keys(giphyData.images).flatMap((key) => {
        const formats = ['url', 'mp4', 'webp'];
        return formats
            .filter((format) => giphyData.images[key][format])
            .map((format) => ({
                type: key,
                format: format === 'url' ? 'gif' : format,
                url: giphyData.images[key][format],
                id: giphyData.id,
                width: giphyData.images[key].width,
                height: giphyData.images[key].height,
                title: giphyData.title,
            }));
    });

    await Promise.all(gifs.map((gif) => sendToQueue(Config.rabbitmq.queueName, gif)));
    return gifs;
}

export default { pushGifsToQueue };
