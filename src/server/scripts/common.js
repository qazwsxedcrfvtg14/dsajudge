import 'babel-polyfill';
import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost/adajudge');
mongoose.Promise = Promise;
