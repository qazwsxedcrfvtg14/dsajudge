import 'babel-polyfill';
import express from 'express';
import config from './config';
import auth from './auth';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import mongoose from 'mongoose';
import problemRouter from './routers/problem';
import submitRouter from './routers/submit';
import adminRouter from './routers/admin';
import logger from './logger';

const MongoStore = require('connect-mongo')(expressSession); 

mongoose.connect(config.mongo.url);
mongoose.Promise = Promise;

const app = express();

app.use(express.static('static'));
app.use(cookieParser());
app.use(expressSession({
    secret: 'aabbccaabbddaaeeff',
    maxAge: 1000 * 3600 * 1000,
    secure: false,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        url: 'mongodb://localhost/adajudge',
        touchAfter: 3600,
    }),
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
auth(app);

app.use('/problem', problemRouter);
app.use('/submit', submitRouter);
app.use('/admin', adminRouter);

app.get('/me', (req, res) => {
    if (req.user) {
        res.send({
            login: true,
            user: req.user,
        });
    } else {
        res.send({
            login: false,
        });
    }
});

app.listen(config.port, () => logger.info(`Server start @ ${config.port}`));

import problemParse from './parseProblem';
