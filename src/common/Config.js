import dotenv from 'dotenv'

dotenv.config()

class Config {
    static get redis() {
        return {
            URL: process.env.REDIS_URL || 'redis://localhost:6379'
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
            serviceLayer: {
                url: process.env.SERVICE_LAYER_URL || 'http://localhost:3000',
                origin: process.env.SERVICE_LAYER_ORIGIN || '*'
            }
        }
    }
}

export default Config
