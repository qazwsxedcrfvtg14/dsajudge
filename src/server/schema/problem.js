import mongoose from 'mongoose';
import autoIncrement from './autoIncrement';

const Schema = mongoose.Schema;

const schema = Schema({
    _id: {
        type: Number,
        index: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        default: 'Hao123',
    },
    visible: {
        type: Boolean,
        required: true,
        default: false,
    },
    meta: {
        timeLimit: Number,
    },
    testdata: {
        count: Number,
        points: Number,
        groups: [{
            count: Number,
            points: Number,
            tests: [String],
        }]
    },
    testFiles: [String],
});

schema.plugin(autoIncrement.plugin, 'Problem');
const Problem = mongoose.model('Problem', schema);
export default Problem;

