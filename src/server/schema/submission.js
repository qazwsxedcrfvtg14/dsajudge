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
        groups: [{
            result: String,
            points: Number,
            tests: [String],
        }],
    },
});

schema.plugin(autoIncrement.plugin, 'Submission');
const Submission = mongoose.model('Submission', schema);
export default Submission;

