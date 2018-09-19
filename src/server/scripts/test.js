import mongoose from 'mongoose';
import config from '/config';
//mongoose.connect(config.mongo.url);
import User from './user';
import Problem from './problem';
import bcrypt from 'bcrypt';

let password = bcrypt.hashSync('123123', 10);

import '@babel/polyfill';
import moment from 'moment-timezone';
import Homework from './homework';

if (require.main === module) {
    mongoose.connect(config.mongo.url);
    (async () => {
    let h = new Homework({
        name: 'Homework #0',
        due: moment().add('2', 'days'),
        problems: [7, 8, 9],
        visible: true,
        meta: {
            //pdfLink: 'hao123.com',
        }
    });
    await h.save();
    console.log(123);
    })();
}
