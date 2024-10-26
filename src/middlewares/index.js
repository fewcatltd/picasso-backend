import compression from 'compression';
import cors from 'cors';
import express from 'express'
import {createRequire} from "module";

const apiMetrics = createRequire(import.meta.url)("prometheus-api-metrics");

export default (app) => {
    app.use(cors());
    app.use(compression());
    app.use(express.urlencoded({extended: false}));
    app.use(express.json());
    app.use(apiMetrics());
};
