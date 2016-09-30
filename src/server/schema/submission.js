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
    status: {
        type: String,
    },
    results: {
        result: String,
        points: {
            type: Number,
            default: 0,
        },
        runtime: Number,
        groups: [{
            result: String,
            points: Number,
            runtime: Number,
            tests: [{
                result: String,
                points: Number,
                runtime: Number,
            }],
        }],
    },
});

schema.plugin(autoIncrement.plugin, 'Submission');
const Submission = mongoose.model('Submission', schema);
export default Submission;

