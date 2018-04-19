import mongoose from 'mongoose';
import autoIncrement from './autoIncrement';

const Schema = mongoose.Schema;

const schema = Schema({
    name: {
        type: String,
        required: true,
        default: 'A Brand New Homework.',
    },
    due: Date,
    visible: {
        type: Boolean,
        default: false,
    },
    problems: [{
        problem: {
            type: Number,
            ref: 'Problem',
        },
        weight: {
            type: Number,
            default: 1,
        }
    }],
    problemNum: {
        type: Number,
        default: 0,
    },
    totalPoints: {
        type: Number,
        default: 0,
    },
    desc: {
        type: String,
        default: "",
    },
    meta: {
        pdfLink: String,
    },
    showStatistic: {
        type: Boolean,
        default: false,
    },
});

schema.plugin(autoIncrement.plugin, 'Homework');
const Homework = mongoose.model('Homework', schema);
export default Homework;
