import express from 'express';
import checkRabbitMqConnection from "../middlewares/checkRabbitMqConnection.js";
import checkRedisConnection from "../middlewares/checkRedisConnection.js";
import checkDbConnection from "../middlewares/checkDbConnection.js";

const router = express.Router();

router.get('/readiness', async (req, res) => {
    res.send('Ok');
});

router.get('/liveness',
    checkRedisConnection,
    checkDbConnection,
    checkRabbitMqConnection,
    (req, res) => {
        res.send('Ok');
    });

export default router;
