import mongoose from 'mongoose';
import autoIncrement from './autoIncrement';

const Schema = mongoose.Schema;

const schema = Schema({
    problem: {
        type: Number,
        ref: 'Problem',
        required: true,
    },
    submittedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ts: {
        type: Date,
        default: Date.now,
    },
    judgeTs: Date,
    status: String,
    result: String,
    points: Number,
    runtime: Number,
    gitCommitHash: String,
    _result: {
        type: Schema.Types.ObjectId,
        ref: 'Result',
    }
});

schema.methods.populateResult = function() {
    return this.populate('_result')
        .populate('_result.subresults')
        .populate('_result.subresults.subresults')
    ;
};

schema.plugin(autoIncrement.plugin, 'Submission');
const Submission = mongoose.model('Submission', schema);
export default Submission;

