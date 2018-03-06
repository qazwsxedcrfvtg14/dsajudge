import 'source-map-support/register';
import 'babel-polyfill';
import express from 'express';
import config from './config';
import auth from './auth';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';

import mongoose from 'mongoose';
mongoose.connect(config.mongo.url);
mongoose.Promise = Promise;

import autoIncrement from 'mongoose-auto-increment';
const MongoStore = require('connect-mongo')(expressSession); 

import logger from './logger';

const app = express();

app.use(express.static('static'));
app.use(cookieParser());
app.use(expressSession({
    secret: config.secret,
    maxAge: 1000 * 3600 * 1000,
    secure: false,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        url: config.mongo.url,
        touchAfter: 3600,
    }),
}));
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb',extended: true}));
auth(app);

import setRouter from './router';
setRouter(app);

app.listen(config.port, '127.0.0.1', () => logger.info(`Server start @ ${config.port}`));

import judger from '/judger';
judger();
