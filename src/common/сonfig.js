import dotenv from 'dotenv'

dotenv.config()

class Config {

    static get worker() {
        return {
            port: process.env.WORKER_PORT || 3000,
            maxConcurrentTasks: process.env.WORKER_MAX_CONCURRENT_TASKS || 50
        }
    }
    static get rabbitmq() {
        return {
            url: process.env.RABBITMQ_URL || 'amqp://picasso:picasso@localhost:5672/',
            queueName: process.env.RABBITMQ_QUEUE_NAME || 'gifQueue',
            prefetch: process.env.RABBITMQ_PREFETCH || 50
        }
    }
    static get redis() {
        return {
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        }
    }

    static get s3() {
        return {
            bucketName: process.env.S3_BUCKET_NAME,
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS,
            region: process.env.S3_REGION,
            endpoint: process.env.S3_ENDPOINT,
        }
    }

    static get giphy() {
        return {
            apiKey: process.env.GIPHY_API_KEY,
            url: process.env.GIPHY_URL || 'https://api.giphy.com/v1',
        }
    }


    static get database() {
        return {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            username: process.env.DB_USER || 'picasso',
            password: process.env.DB_PASSWORD || 'picasso',
            database: process.env.DB_DATABASE || '',
            dialectOptions: {
                ssl:
                    process.env.DB_SSL_MODE === 'true'
                        ? {
                            ca: process.env.DB_CA_CERT || undefined,
                            rejectUnauthorized: false
                        }
                        : false
            }
        }
    }

    static get winston() {
        return {
            level: process.env.LOG_LEVEL || 'info',
        }
    }

    static get microservices() {
        return {
            apiGateway: {
                internalUrl: process.env.API_GATEWAY_INTERNAL_URL || 'http://localhost:3000',
                externalUrl: process.env.API_GATEWAY_EXTERNAL_URL || 'http://localhost:3000',
            }
        }
    }
}

export default Config
