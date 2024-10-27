import compression from 'compression';
import cors from 'cors';
import express from 'express'

export default (app) => {
    app.use(cors());
    app.use(compression());
    app.use(express.urlencoded({extended: false}));
    app.use(express.json());
};
