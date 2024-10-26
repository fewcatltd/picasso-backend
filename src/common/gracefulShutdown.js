import Logger from "./logger.js";

const logger = Logger.child({module: 'gracefulShutdown.js'});
export default (server, callback) => {
    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully...');
        server.close(async () => {
            logger.info('Server closed.');
            await callback();
            process.exit(0);
        });

        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down.');
            process.exit(1);
        }, 10000);
    })
}
