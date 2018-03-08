import 'source-map-support/register';
import 'babel-polyfill';
import http from 'http';
import express from 'express';
import config from './config';
import auth from './auth';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import sharedsession from 'express-socket.io-session';
import Socketio from 'socket.io';
import mongoose from 'mongoose';

mongoose.connect(config.mongo.url);
mongoose.Promise = Promise;

import autoIncrement from 'mongoose-auto-increment';
const MongoStore = require('connect-mongo')(expressSession); 

import logger from './logger';

const app = express();
const server = http.createServer(app);

app.use('/static',express.static('static'));
app.use(express.static('static'));
app.use(cookieParser());
const session = expressSession({
    secret: config.secret,
    maxAge: 1000 * 3600 * 1000,
    secure: false,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        url: config.mongo.url,
        touchAfter: 3600,
    }),
});
app.use(session);
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb',extended: true}));
auth(app);

import setRouter from './router';
setRouter(app);

const io = Socketio(server);
io.use(sharedsession(session, {
    autoSave:true
}));
io.on('connection',(socket)=>{
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

server.listen(config.port, '127.0.0.1', () => logger.info(`Server start @ ${config.port}`));
//app.listen(config.port, '127.0.0.1', () => logger.info(`Server start @ ${config.port}`));

import judger from '/judger';
judger();
