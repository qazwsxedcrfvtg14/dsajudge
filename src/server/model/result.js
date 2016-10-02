import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const schema = Schema({
    result: String,
    points: {
        type: Number,
        default: 0,
    },
    runtime: Number,
    subresults: [{
        type: Schema.Types.ObjectId,
        ref: Result,
    }],
});

const Submission = mongoose.model('Result', schema);
export default Submission;

