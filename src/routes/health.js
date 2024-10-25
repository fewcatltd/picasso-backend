import express from 'express';

const router = express.Router();

router.get('/readness', async (req, res) => {
    res.send('Ok');
});

router.get('/liveness',
    async (req, res, next) => {
        const {redis} = req.app.locals;
        if (!redis) {
            return res.status(503).send('Service Unavailable: Redis is not connected');
        }
        if (redis.status !== 'ready') {
            return res.status(503).send('Service Unavailable: Redis is not connected');
        }
        next();
    },
    async (req, res, next) => {
        const {db} = req.app.locals;
        if (!db) {
            return res.status(503).send('Service Unavailable: Database is not connected');
        }
        await db.sequelize.query('SELECT 1')
            .catch(_ => {
                return res.status(503).send('Service Unavailable: Database is not ready');
            })
        next();
    },
    async (req, res) => {
        res.send('Ok');
    });

export default router;
