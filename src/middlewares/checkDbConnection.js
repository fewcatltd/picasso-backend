import Logger from "../common/logger.js";

const logger = Logger.child({module: 'checkDbConnection.js'});
export default async (req, res, next) => {
    const {db} = req.app.locals;
    if (!db) {
        logger.error('Service Unavailable: Database not initialized');
        return res.status(503).send('Service Unavailable: Database is not connected');
    }
    await db.sequelize.query('SELECT 1')
        .catch(_ => {
            logger.error('Service Unavailable: Database is not ready');
            return res.status(503).send('Service Unavailable: Database is not ready');
        })
    next();
}
