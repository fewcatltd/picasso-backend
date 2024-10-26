export default async (req, res, next) => {
    const {db} = req.app.locals;
    if (!db) {
        return res.status(503).send('Service Unavailable: Database is not connected');
    }
    await db.sequelize.query('SELECT 1')
        .catch(_ => {
            return res.status(503).send('Service Unavailable: Database is not ready');
        })
    next();
}
