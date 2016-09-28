import mongoose from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';

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
        points: Number, 
        groups: [{
            result: String,
            points: Number,
            tests: [String],
        }],
    },
});

autoIncrement.initialize(mongoose.connection);
schema.plugin(autoIncrement.plugin, 'Submission');
const Submission = mongoose.model('Submission', schema);
export default Submission;

