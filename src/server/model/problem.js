import mongoose from 'mongoose';
import autoIncrement from './autoIncrement';

const Schema = mongoose.Schema;

const schema = Schema({
    name: {
        type: String,
        required: true,
        default: 'A Brand New Problem',
    },
    visible: {
        type: Boolean,
        required: true,
        default: false,
    },
    timeLimit: {
        type: Number,
        default: 1,
    },
    quota: {
        type: Number,
        default: 5,
    },
    hasSpecialJudge: {
        type: Boolean,
        default: false,
    },
    notGitOnly: {
        type: Boolean,
        default: false,
    },
    showStatistic: {
        type: Boolean,
        default: false,
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
    resource: [String],
});

schema.plugin(autoIncrement.plugin, 'Problem');
const Problem = mongoose.model('Problem', schema);
export default Problem;

