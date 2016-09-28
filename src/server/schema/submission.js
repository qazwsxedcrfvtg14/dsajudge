import mongoose from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';

const Schema = mongoose.Schema;

const schema = Schema({
    _id: {
        type: Number,
        index: true,
        unique: true,
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
    points: {
        type: Number,
    },
    results: {
        type: {
            main: String,
            tests: [String],
        },
    },
});

const Submission = mongoose.model('Submission', Submission);
export default Submission;

