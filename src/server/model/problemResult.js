import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const schema = Schema({
    problem: {
        type: Number,
        ref: 'Problem',
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ts: {
        type: Date,
    },
    points: {
        type: Number,
        default: 0,
    },
    AC: {
        type: Boolean,
        default: false,
    },
});

const ProblemResult = mongoose.model('ProblemResult', schema);
export default ProblemResult;

