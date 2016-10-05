import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const schema = Schema({
    homework: {
        type: Number,
        ref: 'Homework',
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
        type: Number,
        default: 0,
    },
    subresults: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ProblemResult',
        }
    ],
});

const HomeworkResult = mongoose.model('HomeworkResult', schema);
export default HomeworkResult;

