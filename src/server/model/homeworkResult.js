import mongoose from 'mongoose';
import Submission from './submission';

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
            type: Number,
            ref: 'Submission',
        }
    ],
});

schema.methods.getSubresults = async function() {
    const _subs = await Promise.all(this.subresults.map(x => (async () => {
        if (!x) return;
        return await Submission.findById(x);
    })() ));
    return _subs;
};

const HomeworkResult = mongoose.model('HomeworkResult', schema);
export default HomeworkResult;

