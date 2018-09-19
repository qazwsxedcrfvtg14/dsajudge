import '@babel/polyfill';
import config from '/config';
import mongoose from 'mongoose';
mongoose.connect(config.mongo.url);
mongoose.Promise = Promise;

import '/model/homework';
import '/model/submission';
