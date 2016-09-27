import mongoose from 'mongoose';
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

