import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const schema = Schema({
    result: String,
    points: {
        type: Number,
        default: 0,
    },
    maxPoints: Number,
    runtime: Number,
    subresults: [{
        type: Schema.Types.ObjectId,
        ref: 'Result',
    }],
    name: String,
});

schema.methods.purge = function() {
    return (async () => {
        for (let id of this.subresults) {
            const model = await this.model('Result').findById(id);
            await model.purge();
        }
        await this.remove();
        return this;
    })();
};

const Result = mongoose.model('Result', schema);
export default Result;

