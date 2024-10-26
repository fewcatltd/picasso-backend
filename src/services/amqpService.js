import amqp from 'amqplib';
import Logger from "../common/logger.js";
import Config from "../common/сonfig.js";

const logger = Logger.child({ module: 'amqpService.js' });

let connection;
let channels = {};

export async function initRabbitMQ() {
    if (connection) return connection;

    try {
        connection = await amqp.connect(Config.rabbitmq.url);

        connection.on('error', (error) => {
            logger.error('RabbitMQ connection error:', error);
            setTimeout(initRabbitMQ, 5000);
        });

        connection.on('close', () => {
            logger.info('RabbitMQ connection closed, reconnecting...');
            setTimeout(initRabbitMQ, 5000);
        });

        logger.info('RabbitMQ connection established');
        return connection;
    } catch (error) {
        logger.error('Failed to establish RabbitMQ connection:', error);
        process.exit(1);
    }
}

export async function getChannel(queueName) {
    if (channels[queueName]) return channels[queueName];

    try {
        const conn = await initRabbitMQ();
        const channel = await conn.createChannel();
        await channel.assertQueue(queueName, { durable: true });
        channel.prefetch(Config.rabbitmq.prefetch);
        channels[queueName] = channel;
        logger.info(`Channel for queue "${queueName}" initialized`);
        return channel;
    } catch (error) {
        logger.error(`Failed to create channel for queue "${queueName}":`, error);
        throw error;
    }
}

export async function sendToQueue(queueName, data) {
    const channel = await getChannel(queueName);
    await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });
    logger.info(`Message sent to queue "${queueName}"`);
}

export async function consumeQueue(queueName, callback) {
    const channel = await getChannel(queueName);
    channel.consume(queueName, callback);
    logger.info(`Started consuming queue "${queueName}"`);
}

export async function closeConnection() {
    if (connection) {
        await connection.close();
        logger.info('RabbitMQ connection closed');
    }
}

export function getConnection() {
    return connection;
}
