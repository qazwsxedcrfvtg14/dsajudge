import 'babel-polyfill';
import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost/adajudge', {
  useMongoClient: true,
});
mongoose.Promise = Promise;

import '/model/homework';
import '/model/submission';
