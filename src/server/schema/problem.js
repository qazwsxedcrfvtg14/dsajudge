import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = Schema({
    _id: {
        type: Number,
        index: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    visible: {
        type: Boolean,
        required: true,
    },
    meta: {
        timeLimit: Number,
    },
    testdata: {
        count: Number,
        points: Number,
        groups: [{
            count: Number,
            points: Number,
            tests: [String],
        }]
    }
});

const Problem = mongoose.model('Problem', schema);
export default Problem;

