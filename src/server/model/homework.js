import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const schema = Schema({
    name: {
        type: String,
        required: true,
        default: 'Hao123',
    },
    due: Date,
    visible: {
        type: Boolean,
        default: false,
    },
    problems: [{
        type: Number,
        ref: 'Problem',
    }],
    problemNum: {
        type: Number,
        default: 0,
    },
    maxPoints: {
        type: Number,
        default: 0,
    },
    meta: {
        pdfLink: String,
    },
});

const Homework = mongoose.model('Homework', schema);
export default Homework;

//import 'babel-polyfill';
//import moment from 'moment-timezone';
//import config from '/config';
//if (require.main === module) {
    //mongoose.connect(config.mongo.url);
    //(async () => {
    //let h = new Homework({
        //name: 'Homework Hao123',
        //due: moment().add('5', 'hours'),
        //problems: [6],
        //visible: true,
        //meta: {
            //pdfLink: 'hao123.com',
        //}
    //});
    //console.log(h);
    //await h.save();
    //console.log(h);
    //let zz = await Homework.findOne({});
        //console.log(zz, 123);
    //})();
//}

//import Problem from './user';
//let test = new Problem ({
    ////name: 'Homework Hao123',
    ////due: moment().add('5', 'hours'),
    ////problems: [6],
    ////meta: {
        ////pdfLink: 'hao123.com',
    ////}
//});
//test.save((err, x) => console.log(err, x));
